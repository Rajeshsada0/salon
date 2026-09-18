<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CentralDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the central Super Admin user
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@salon.com',
            'password' => bcrypt('password'),
            'is_super_admin' => true,
        ]);
    }
}
