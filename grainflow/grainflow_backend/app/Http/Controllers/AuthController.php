<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Google\Client as GoogleClient;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    public function googleLogin(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        try {
            $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]); 
            $payload = $client->verifyIdToken($request->token);

            if ($payload) {
                $email = $payload['email'];
                $user = User::where('email', $email)->first();

                if ($user) {
                    $token = $user->createToken('auth_token')->plainTextToken;
                    return response()->json([
                        'exists' => true,
                        'message' => 'Login successful!',
                        'user' => $user,
                        'token' => $token
                    ], 200);
                } else {
                    return response()->json([
                        'exists' => false,
                        'message' => 'User not found. Redirecting to signup...',
                        'google_data' => [
                            'email' => $email,
                            'name' => $payload['name'] ?? '',
                        ]
                    ], 200);
                }
            }
            return response()->json(['message' => 'Invalid Google token'], 401);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Authentication failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function register(Request $request)
    {
        // 🚀 Detect if this is a Google Registration
        $isGoogleReg = $request->password === 'GOOGLE_AUTH_EXTERNAL';

        $rules = [
            'name' => 'required|string|max:255',
            'store_name' => 'required|string|max:255', 
            'email' => 'required|string|email|max:255|unique:users',
        ];

        // 🚀 Only apply strict password validation if NOT a Google Registration
        if (!$isGoogleReg) {
            $rules['password'] = [
                'required',
                'string',
                'min:8',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ];
        }

        $validatedData = $request->validate($rules);

        // 1. Create the user but they are NOT "verified" yet
        $code = (string) rand(100000, 999999);
        
        // 🚀 If Google signup, generate a secure random password as a placeholder
        $finalPassword = $isGoogleReg ? Str::random(32) : $validatedData['password'];

        $user = User::create([
            'name' => $validatedData['name'],
            'store_name' => $validatedData['store_name'], 
            'email' => strtolower($validatedData['email']),
            'password' => Hash::make($finalPassword),
            'verification_code' => $code,
        ]);

        // 2. Send the email instantly via Resend API
        try {
            $response = Http::withToken(env('RESEND_API_KEY'))
                ->post('https://api.resend.com/emails', [
                    'from' => 'GrainFlow <onboarding@resend.dev>',
                    'to' => [$user->email],
                    'subject' => '🌾 Welcome to GrainFlow! Verify your account',
                    'html' => "
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center;'>
                            <h1 style='color: #ea580c;'>Welcome to GrainFlow!</h1>
                            <p>Thanks for joining. Please use the code below to verify your email and activate your rice store dashboard.</p>
                            <div style='margin: 30px 0; padding: 20px; background-color: #fff7ed; border: 2px dashed #ea580c; border-radius: 8px;'>
                                <span style='font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 5px;'>{$code}</span>
                            </div>
                            <p style='color: #718096; font-size: 12px;'>If you didn't sign up for GrainFlow, you can safely ignore this email.</p>
                        </div>
                    ",
                ]);

            if (!$response->successful()) {
                throw new \Exception('Resend API Error: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Signup Mail Error: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful! Please check your email for the verification code.',
            'email' => $user->email
        ], 201);
    }

    public function verifySignup(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string'
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || $user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 422);
        }

        // Mark as verified
        $user->verification_code = null; 
        $user->save();

        // Now give them their login token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified! Welcome to GrainFlow.',
            'user' => $user,
            'token' => $token
        ], 200);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401); 
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully!',
            'user' => $user,
            'token' => $token
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update([
            'name' => $validatedData['name'],
            'email' => strtolower($validatedData['email']),
            'phone' => $validatedData['phone'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => $user
        ]);
    }

    public function updateStoreDetails(Request $request)
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_address' => 'nullable|string|max:500',
            'logo' => 'nullable|string', 
        ]);

        $user->store_name = $validatedData['store_name'];
        $user->store_address = $validatedData['store_address'];

        if ($request->has('logo')) {
            $user->logo_path = $validatedData['logo']; 
        }

        $user->save();

        return response()->json([
            'message' => 'Store settings updated!',
            'user' => $user
        ]);
    }

    public function sendVerificationCode(Request $request)
    {
        $user = $request->user();
        $code = rand(100000, 999999);
        
        $user->verification_code = $code;
        $user->save();

        Log::info("Verification code for {$user->email}: {$code}");

        try {
            $response = Http::withToken(env('RESEND_API_KEY'))
                ->post('https://api.resend.com/emails', [
                    'from' => 'GrainFlow <onboarding@resend.dev>',
                    'to' => [$user->email],
                    'subject' => '🛡️ Secure Access: Your GrainFlow Verification Code',
                    'html' => "
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
                            <div style='background: linear-gradient(135deg, #eae6c9 0%, #eae6c9 100%); padding: 30px; text-align: center;'>
                                <h1 style='color: #6e6356; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;'>GrainFlow</h1>
                                <p style='color: #6e6356; margin-top: 10px; font-weight: bold;'>Business Intelligence & POS Systems</p>
                            </div>
                            <div style='padding: 40px; background-color: white; text-align: center;'>
                                <h2 style='color: #1a202c; margin-bottom: 20px;'>Security Verification</h2>
                                <p style='color: #4a5568; line-height: 1.6;'>A request has been made to verify your identity. Use the secure authorization code below to proceed with your password update.</p>
                                <div style='margin: 30px 0; padding: 20px; background-color: #eae6c9; border: 2px dashed #6e6356; border-radius: 8px;'>
                                    <span style='font-size: 36px; font-weight: 800; color: #6e6356; letter-spacing: 10px;'>{$code}</span>
                                </div>
                                <p style='color: #718096; font-size: 13px;'>This code is valid for a limited time. If you did not request this, please secure your account immediately.</p>
                            </div>
                            <div style='background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;'>
                                <p style='color: #94a3b8; font-size: 12px; margin: 0;'>© " . date('Y') . " GrainFlow. Empowering your rice business with Intelligence.</p>
                            </div>
                        </div>
                    ",
                ]);

            if (!$response->successful()) {
                throw new \Exception('Resend API Error: ' . $response->body());
            }

            return response()->json(['message' => 'Verification code sent to your email.']);
        } catch (\Exception $e) {
            Log::error("Mail error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to send email.', 'error' => $e->getMessage()], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
        ], [
            'new_password.regex' => 'The new password must contain at least one number and one special character.'
        ]);

        $user = $request->user();

        if ($user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid or expired security code.'], 422);
        }

        if (Hash::check($request->new_password, $user->password)) {
            return response()->json(['message' => 'New password cannot be the same as your current password.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->verification_code = null; 
        $user->save();

        return response()->json([
            'message' => 'Password updated! You can now log in manually with your email.'
        ]);
    }

    public function forgotPasswordSendCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ], [
            'email.exists' => 'We could not find an account with that email address.'
        ]);

        $user = User::where('email', strtolower($request->email))->first();
        $code = (string) rand(100000, 999999);
        
        $user->verification_code = $code;
        $user->save();

        Log::info("Forgot Password code for {$user->email}: {$code}");

        try {
            $response = Http::withToken(env('RESEND_API_KEY'))
                ->post('https://api.resend.com/emails', [
                    'from' => 'GrainFlow <onboarding@resend.dev>',
                    'to' => [$user->email],
                    'subject' => '🔐 Password Reset: Your Verification Code',
                    'html' => "
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
                            <div style='background: linear-gradient(135deg, #eae6c9 0%, #eae6c9 100%); padding: 30px; text-align: center;'>
                                <h1 style='color: #6e6356; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;'>GrainFlow</h1>
                                <p style='color: #6e6356; margin-top: 10px; font-weight: bold;'>Account Recovery</p>
                            </div>
                            <div style='padding: 40px; background-color: white; text-align: center;'>
                                <h2 style='color: #1a202c; margin-bottom: 20px;'>Password Reset Requested</h2>
                                <p style='color: #4a5568; line-height: 1.6;'>We received a request to reset the password for your GrainFlow account. Use the code below to proceed.</p>
                                <div style='margin: 30px 0; padding: 20px; background-color: #eae6c9; border: 2px dashed #6e6356; border-radius: 8px;'>
                                    <span style='font-size: 36px; font-weight: 800; color: #6e6356; letter-spacing: 10px;'>{$code}</span>
                                </div>
                                <p style='color: #718096; font-size: 13px;'>If you did not request this password reset, please ignore this email or contact support.</p>
                            </div>
                            <div style='background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;'>
                                <p style='color: #94a3b8; font-size: 12px; margin: 0;'>© " . date('Y') . " GrainFlow. Empowering your rice business with Intelligence.</p>
                            </div>
                        </div>
                    ",
                ]);

            if (!$response->successful()) {
                throw new \Exception('Resend API Error: ' . $response->body());
            }

            return response()->json(['message' => 'Recovery code sent to your email.']);
        } catch (\Exception $e) {
            Log::error("Mail error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to send email.', 'error' => $e->getMessage()], 500);
        }
    }

    public function forgotPasswordReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
        ], [
            'new_password.regex' => 'The new password must contain at least one number and one special character.'
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user->verification_code || $user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid or expired recovery code.'], 422);
        }

        if (Hash::check($request->new_password, $user->password)) {
            return response()->json(['message' => 'New password cannot be the same as your current password.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->verification_code = null; 
        $user->save();

        return response()->json([
            'message' => 'Password reset successfully! You can now log in.'
        ]);
    }

    public function updateMonthlyGoal(Request $request)
    {
        $user = $request->user();
        $validatedData = $request->validate([
            'monthly_goal' => 'required|numeric|min:0',
        ]);
        $user->monthly_goal = $validatedData['monthly_goal'];
        $user->save();
        return response()->json(['message' => 'Monthly goal updated!', 'user' => $user]);
    }

    public function getGoalSuggestions(Request $request)
    {
        $user = $request->user();
        $actualRevenue = Transaction::where('user_id', $user->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->where('status', 'paid')
            ->sum('total_amount');

        $baseline = $actualRevenue > 0 ? $actualRevenue : 50000;

        return response()->json([
            'current_goal' => $user->monthly_goal,
            'actual_30d_revenue' => $actualRevenue,
            'suggestions' => [
                ['label' => 'Growth', 'value' => round(($baseline * 1.15) / 1000) * 1000],
                ['label' => 'Stretch', 'value' => round(($baseline * 1.35) / 1000) * 1000],
                ['label' => 'Elite',   'value' => round(($baseline * 1.60) / 1000) * 1000],
            ]
        ]);
    }

    public function sendFeedback(Request $request)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $stars = str_repeat('⭐', $request->rating) . str_repeat('⚪', 5 - $request->rating);
        $currentDate = date('d M Y');
        $currentTime = date('h:i A');

        try {
            $htmlContent = "
                <div style='background-color: #fdfaf7; padding: 40px 0; font-family: \"Inter\", \"Segoe UI\", sans-serif;'>
                    <table align='center' border='0' cellpadding='0' cellspacing='0' width='95%' style='max-width: 1150px; background-color: #ffffff; border: 1px solid #e7e0d6; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(67, 44, 25, 0.05);'>
                        <tr>
                            <td style='background-color: #3e2723; padding: 20px 50px; border-bottom: 3px solid #d7ccc8;'>
                                <table width='100%'>
                                    <tr>
                                        <td align='left'>
                                            <h1 style='color: #efebe9; margin: 0; font-size: 20px; letter-spacing: 4px; text-transform: uppercase; font-weight: 900;'>Grain<span style='color: #bcaaa4;'>Flow</span></h1>
                                        </td>
                                        <td align='right'>
                                            <div style='color: #d7ccc8; font-size: 10px; font-weight: 700; text-transform: uppercase; tracking-widest;'>Automated Harvest Feedback</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 18px 50px; background-color: #faf7f2; border-bottom: 1px solid #e7e0d6;'>
                                <table width='100%' style='text-align: left;'>
                                    <tr>
                                        <td style='border-right: 1px solid #efebe9;'>
                                            <p style='font-size: 8px; color: #a1887f; font-weight: 800; text-transform: uppercase; margin: 0;'>User</p>
                                            <p style='font-size: 13px; color: #4e342e; font-weight: 800; margin: 4px 0;'>{$user->name}</p>
                                        </td>
                                        <td style='border-right: 1px solid #efebe9; padding-left: 20px;'>
                                            <p style='font-size: 8px; color: #a1887f; font-weight: 800; text-transform: uppercase; margin: 0;'>Store ID</p>
                                            <p style='font-size: 13px; color: #4e342e; font-weight: 700; margin: 4px 0;'>" . ($user->store_name ?? 'MAIN_BRANCH') . "</p>
                                        </td>
                                        <td style='border-right: 1px solid #efebe9; padding-left: 20px;'>
                                            <p style='font-size: 8px; color: #a1887f; font-weight: 800; text-transform: uppercase; margin: 0;'>Rating</p>
                                            <p style='font-size: 13px; color: #8d6e63; font-weight: 900; margin: 4px 0;'>{$request->rating} / 5</p>
                                        </td>
                                        <td style='border-right: 1px solid #efebe9; padding-left: 20px;'>
                                            <p style='font-size: 8px; color: #a1887f; font-weight: 800; text-transform: uppercase; margin: 0;'>Date</p>
                                            <p style='font-size: 13px; color: #4e342e; font-weight: 700; margin: 4px 0;'>{$currentDate}</p>
                                        </td>
                                        <td style='padding-left: 20px;'>
                                            <p style='font-size: 8px; color: #a1887f; font-weight: 800; text-transform: uppercase; margin: 0;'>Time</p>
                                            <p style='font-size: 13px; color: #4e342e; font-weight: 700; margin: 4px 0;'>{$currentTime}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 50px;'>
                                <table width='100%'>
                                    <tr>
                                        <td width='320' valign='top' style='padding-right: 50px; border-right: 1px solid #efebe9;'>
                                            <div style='font-size: 32px; margin-bottom: 15px;'>{$stars}</div>
                                            <p style='font-size: 12px; color: #795548; line-height: 1.6; margin: 0; font-weight: 500;'>Visual health check of the user's satisfaction.</p>
                                            <div style='margin-top: 35px;'>
                                                <a href='mailto:{$user->email}' style='display: inline-block; background-color: #4e342e; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;'>Contact User</a>
                                            </div>
                                        </td>
                                        <td valign='top' style='padding-left: 50px;'>
                                            <p style='font-size: 10px; font-weight: 900; color: #8d6e63; text-transform: uppercase; margin: 0 0 15px 0; tracking-widest;'>Feedback Note</p>
                                            <div style='background-color: #fffaf0; padding: 35px; border-radius: 25px; border: 1px solid #f3e5f5;'>
                                                <p style='font-size: 17px; color: #3e2723; line-height: 1.8; font-style: italic; font-weight: 500; margin: 0;'>\"" . ($request->comment ?? 'No specific feedback notes were included.') . "\"</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 20px 50px; background-color: #fdfaf7; border-top: 1px solid #efebe9; text-align: center;'>
                                <p style='font-size: 9px; color: #bcaaa4; margin: 0; text-transform: uppercase; letter-spacing: 3px;'>GrainFlow Digital Architecture • Sequence v1.0.4 • Hash ID: " . strtoupper(Str::random(8)) . "</p>
                            </td>
                        </tr>
                    </table>
                </div>
            ";

            $response = Http::withToken(env('RESEND_API_KEY'))
                ->post('https://api.resend.com/emails', [
                    'from' => 'GrainFlow <onboarding@resend.dev>',
                    'to' => ['grainflow1012@gmail.com'],
                    'replyTo' => $user->email,
                    'subject' => "Feedback Report: {$request->rating}/5 | {$user->name}",
                    'html' => $htmlContent,
                ]);

            if (!$response->successful()) {
                throw new \Exception('Resend API Error: ' . $response->body());
            }

            return response()->json(['message' => 'Feedback successfully synchronized.'], 200);
        } catch (\Exception $e) {
            Log::error("Feedback failure: " . $e->getMessage());
            return response()->json(['message' => 'Sync failed.'], 500);
        }
    }
}