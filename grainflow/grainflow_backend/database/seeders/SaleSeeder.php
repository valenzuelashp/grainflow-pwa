<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\User;

class SaleSeeder extends Seeder
{
    public function run()
    {
        // 1. Get the store owner
        $user = User::first();
        if (!$user) {
            $this->command->error("No user found! Please register a user in the app first.");
            return;
        }
        \App\Models\Transaction::where('user_id', $user->id)->delete();
        $this->command->info("🗑️ Old sales deleted!");
        // 2. Open your CSV file
        $csvFile = fopen(database_path('seeders/sales.csv'), 'r');        $firstline = true;

        $this->command->info("⏳ Importing real sales data...");

        while (($data = fgetcsv($csvFile, 2000, ",")) !== FALSE) {
            // Skip the header row
            if (!$firstline) {
                
                // Double check that the row isn't totally empty
                if (!empty($data[2])) { 
                    
                    Transaction::create([
                        'user_id' => $user->id,
                        'product_id' => $data[2],          // Column C: product_id
                        'customer_name' => $data[1] ?: null, // Column B: customer_name (can be blank)
                        'quantity' => $data[4],            // Column E: Quantity
                        'payment_method' => $data[5],      // Column F: payment_method
                        'total_price' => $data[6],         // Column G: Total (NO MATH NEEDED!)
                        'created_at' => $data[7],          // Column H: created_at
                        'updated_at' => $data[7],          // Column H: updated_at
                        'status' => $data[8] ?? 'paid',    // Column I: status (defaults to paid)
                    ]);
                }
            }
            $firstline = false;
        }
        fclose($csvFile);
        $this->command->info('✅ Real historical sales data imported perfectly!');
    }
}