<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\ServicePackage;
use App\Models\Appointment;
use App\Models\Invoice;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Permissions
        $permissions = [
            'manage branches',
            'manage staff',
            'manage customers',
            'manage services',
            'manage inventory',
            'manage appointments',
            'view reports',
            'book appointments',
            'view own appointments',
            'manage POS',
            'manage billing',
            'manage loyalty',
            'manage financials',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // 2. Create Roles and Assign Permissions
        $ownerRole = Role::findOrCreate('Salon Owner', 'web');
        $ownerRole->givePermissionTo(Permission::all());

        $managerRole = Role::findOrCreate('Branch Manager', 'web');
        $managerRole->givePermissionTo([
            'manage staff',
            'manage customers',
            'manage services',
            'manage inventory',
            'manage appointments',
            'view reports',
            'book appointments',
            'manage POS',
            'manage billing',
        ]);

        $receptionistRole = Role::findOrCreate('Receptionist', 'web');
        $receptionistRole->givePermissionTo([
            'manage customers',
            'manage appointments',
            'book appointments',
            'manage POS',
            'manage billing',
        ]);

        $stylistRole = Role::findOrCreate('Stylist', 'web');
        $stylistRole->givePermissionTo([
            'view own appointments',
        ]);

        $beauticianRole = Role::findOrCreate('Beautician', 'web');
        $beauticianRole->givePermissionTo([
            'view own appointments',
        ]);

        $accountantRole = Role::findOrCreate('Accountant', 'web');
        $accountantRole->givePermissionTo([
            'view reports',
            'manage billing',
            'manage financials',
        ]);

        $customerRole = Role::findOrCreate('Customer', 'web');
        $customerRole->givePermissionTo([
            'book appointments',
        ]);

        // 3. Create Default Users (Staff)
        $owner = User::firstOrCreate(
            ['email' => 'owner@salon.com'],
            [
                'name' => 'Salon Owner',
                'password' => bcrypt('password'),
            ]
        );
        $owner->assignRole($ownerRole);

        if (app()->environment('testing')) {
            return;
        }

        // Jane Doe (Stylist)
        $stylist1 = User::firstOrCreate(
            ['email' => 'jane@salon.com'],
            [
                'name' => 'Jane Doe',
                'password' => bcrypt('password'),
                'joining_date' => now()->subMonths(6)->toDateString(),
                'salary' => 3000.00,
                'commission_percentage' => 10.00,
            ]
        );
        $stylist1->assignRole($stylistRole);

        // John Smith (Beautician)
        $stylist2 = User::firstOrCreate(
            ['email' => 'john@salon.com'],
            [
                'name' => 'John Smith',
                'password' => bcrypt('password'),
                'joining_date' => now()->subMonths(3)->toDateString(),
                'salary' => 2800.00,
                'commission_percentage' => 8.00,
            ]
        );
        $stylist2->assignRole($beauticianRole);

        // Sarah Connor (Receptionist)
        $receptionist = User::firstOrCreate(
            ['email' => 'sarah@salon.com'],
            [
                'name' => 'Sarah Connor',
                'password' => bcrypt('password'),
                'joining_date' => now()->subYear()->toDateString(),
                'salary' => 2500.00,
                'commission_percentage' => 0.00,
            ]
        );
        $receptionist->assignRole($receptionistRole);

        // 4. Create Customers
        $customer1 = Customer::firstOrCreate(
            ['email' => 'alice@gmail.com'],
            [
                'name' => 'Alice Johnson',
                'mobile' => '9807835331',
                'gender' => 'female',
                'dob' => '1995-05-15',
                'address' => '123 Main St, Central City',
                'group' => 'VIP',
                'loyalty_points' => 120,
                'wallet_balance' => 50.00,
            ]
        );

        $customer2 = Customer::firstOrCreate(
            ['email' => 'bob@gmail.com'],
            [
                'name' => 'Bob Miller',
                'mobile' => '9807835332',
                'gender' => 'male',
                'dob' => '1988-09-22',
                'address' => '456 Oak Rd, Pineville',
                'group' => 'Regular',
                'loyalty_points' => 45,
                'wallet_balance' => 0.00,
            ]
        );

        $customer3 = Customer::firstOrCreate(
            ['email' => 'charlie@gmail.com'],
            [
                'name' => 'Charlie Brown',
                'mobile' => '9807835333',
                'gender' => 'other',
                'dob' => '2001-11-03',
                'address' => '789 Elm Ave, Mapleton',
                'group' => 'New',
                'loyalty_points' => 0,
                'wallet_balance' => 15.00,
            ]
        );

        // 5. Create Service Categories
        $hairCategory = ServiceCategory::firstOrCreate(
            ['name' => 'Hair Services'],
            ['description' => 'Haircuts, styling, coloring, and treatments', 'sort_order' => 1]
        );

        $skinCategory = ServiceCategory::firstOrCreate(
            ['name' => 'Skin Care'],
            ['description' => 'Facials, massages, and skin treatments', 'sort_order' => 2]
        );

        $nailCategory = ServiceCategory::firstOrCreate(
            ['name' => 'Nail Services'],
            ['description' => 'Manicures, pedicures, and nail art', 'sort_order' => 3]
        );

        // 6. Create Services
        // Hair Services
        $haircut = Service::firstOrCreate(
            ['name' => 'Haircut & Style', 'service_category_id' => $hairCategory->id],
            [
                'description' => 'Standard haircut with washing and styling',
                'price' => 45.00,
                'duration_minutes' => 45,
                'commission_percentage' => 10.00,
            ]
        );

        $coloring = Service::firstOrCreate(
            ['name' => 'Hair Coloring', 'service_category_id' => $hairCategory->id],
            [
                'description' => 'Full head coloring with premium products',
                'price' => 90.00,
                'duration_minutes' => 90,
                'commission_percentage' => 15.00,
            ]
        );

        $blowdry = Service::firstOrCreate(
            ['name' => 'Blow Dry', 'service_category_id' => $hairCategory->id],
            [
                'description' => 'Quick blow dry and styling',
                'price' => 30.00,
                'duration_minutes' => 30,
                'commission_percentage' => 5.00,
            ]
        );

        // Skin Care Services
        $facial = Service::firstOrCreate(
            ['name' => 'Facial Treatment', 'service_category_id' => $skinCategory->id],
            [
                'description' => 'Deep cleansing and hydrating facial massage',
                'price' => 60.00,
                'duration_minutes' => 60,
                'commission_percentage' => 12.00,
            ]
        );

        $massage = Service::firstOrCreate(
            ['name' => 'Relaxing Massage', 'service_category_id' => $skinCategory->id],
            [
                'description' => 'Full body Swedish massage',
                'price' => 75.00,
                'duration_minutes' => 60,
                'commission_percentage' => 15.00,
            ]
        );

        // Nail Services
        $manicure = Service::firstOrCreate(
            ['name' => 'Classic Manicure', 'service_category_id' => $nailCategory->id],
            [
                'description' => 'Nail shaping, cuticle care, and polish',
                'price' => 25.00,
                'duration_minutes' => 30,
                'commission_percentage' => 8.00,
            ]
        );

        $pedicure = Service::firstOrCreate(
            ['name' => 'Classic Pedicure', 'service_category_id' => $nailCategory->id],
            [
                'description' => 'Foot soak, scrub, nail shaping, and polish',
                'price' => 35.00,
                'duration_minutes' => 45,
                'commission_percentage' => 8.00,
            ]
        );

        // 7. Create Service Packages
        $package = ServicePackage::firstOrCreate(
            ['name' => 'Ultimate Pampering Package'],
            [
                'description' => 'A luxury package combining Facial Treatment, Classic Manicure, and Blow Dry.',
                'price' => 100.00,
                'is_active' => true,
            ]
        );
        $package->services()->syncWithoutDetaching([$facial->id, $manicure->id, $blowdry->id]);

        // 8. Create Sample Appointments & Invoices
        // Appointment 1: Today (Confirmed)
        $apt1 = Appointment::firstOrCreate(
            [
                'customer_id' => $customer1->id,
                'staff_id' => $stylist1->id,
                'date' => now()->toDateString(),
                'start_time' => '10:00:00',
            ],
            [
                'end_time' => '10:45:00',
                'status' => 'confirmed',
                'total_amount' => 45.00,
                'notes' => 'First time customer discount request',
            ]
        );
        $apt1->services()->syncWithoutDetaching([$haircut->id => ['price' => 45.00]]);

        // Appointment 2: Today (Completed & Billed)
        $apt2 = Appointment::firstOrCreate(
            [
                'customer_id' => $customer2->id,
                'staff_id' => $stylist2->id,
                'date' => now()->toDateString(),
                'start_time' => '11:00:00',
            ],
            [
                'end_time' => '12:00:00',
                'status' => 'completed',
                'total_amount' => 75.00,
                'notes' => 'Prefers firm pressure',
            ]
        );
        $apt2->services()->syncWithoutDetaching([$massage->id => ['price' => 75.00]]);

        // Generate Invoice for Appointment 2
        $invoice = Invoice::firstOrCreate(
            ['invoice_number' => 'INV-' . date('Ymd') . '-0001'],
            [
                'appointment_id' => $apt2->id,
                'customer_id' => $customer2->id,
                'subtotal' => 75.00,
                'discount_amount' => 0.00,
                'tax_amount' => 7.50,
                'total_amount' => 82.50,
                'payment_method' => 'cash',
                'status' => 'paid',
                'notes' => 'Paid in full',
            ]
        );
        $invoice->items()->firstOrCreate(
            ['service_id' => $massage->id],
            [
                'item_name' => 'Relaxing Massage',
                'unit_price' => 75.00,
                'quantity' => 1,
                'total' => 75.00,
            ]
        );

        // Appointment 3: Tomorrow (Pending)
        $apt3 = Appointment::firstOrCreate(
            [
                'customer_id' => $customer3->id,
                'staff_id' => $stylist1->id,
                'date' => now()->addDay()->toDateString(),
                'start_time' => '14:00:00',
            ],
            [
                'end_time' => '15:30:00',
                'status' => 'pending',
                'total_amount' => 90.00,
                'notes' => 'Wants highlights',
            ]
        );
        $apt3->services()->syncWithoutDetaching([$coloring->id => ['price' => 90.00]]);
    }
}
