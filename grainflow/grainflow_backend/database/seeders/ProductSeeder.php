<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $user = User::first();
        if (!$user) {
            $this->command->error("No user found! Please register first.");
            return;
        }

        $csvFile = fopen(database_path('seeders/products.csv'), 'r');
        $firstline = true;

        $this->command->info("⏳ Importing Products safely...");

        while (($data = fgetcsv($csvFile, 2000, ",")) !== FALSE) {
            if (!$firstline && !empty($data[1])) {
                
                // NEW: Use updateOrCreate to prevent the Unique ID crashing!
                Product::updateOrCreate(
                    ['id' => $data[0]], // 1. Search for this ID first
                    [                   // 2. Update or Create with this data
                        'user_id' => $user->id,
                        'name' => $data[1],
                        'category' => $data[2],
                        'stockQuantity' => $data[3],
                        'unit' => $data[4],
                        'reorderLevel' => $data[5],
                        'sack_price' => $data[6],
                        'tubo' => $data[7],
                        'pricePerUnit' => $data[8],
                        'is_archived' => $data[9] === '1' ? true : false,
                    ]
                );
            }
            $firstline = false;
        }
        fclose($csvFile);
        $this->command->info('✅ Products imported perfectly without crashing!');
    }
}