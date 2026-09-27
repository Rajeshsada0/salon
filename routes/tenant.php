<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

// $centralHost = parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST);

Route::domain('{tenant?}')->where(['tenant' => '.*'])->group(function () {
    // Tenant Web Routes
    Route::middleware([
        'web',
        InitializeTenancyByDomain::class,
        PreventAccessFromCentralDomains::class,
    ])->group(function () {
        Route::redirect('/', '/dashboard');

        // Authenticated Tenant Dashboard & Management
        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Tenant\DashboardController::class, 'index'])->name('dashboard');

            // Staff CRUD
            Route::middleware(['can:manage staff'])->group(function () {
                Route::get('/staff', [\App\Http\Controllers\Tenant\StaffController::class, 'index'])->name('tenant.staff.index');
                Route::post('/staff', [\App\Http\Controllers\Tenant\StaffController::class, 'store'])->name('tenant.staff.store');
                Route::put('/staff/{user}', [\App\Http\Controllers\Tenant\StaffController::class, 'update'])->name('tenant.staff.update');
                Route::delete('/staff/{user}', [\App\Http\Controllers\Tenant\StaffController::class, 'destroy'])->name('tenant.staff.destroy');
            });

            // Customer CRUD
            Route::middleware(['can:manage customers'])->group(function () {
                Route::get('/customers', [\App\Http\Controllers\Tenant\CustomerController::class, 'index'])->name('tenant.customers.index');
                Route::post('/customers', [\App\Http\Controllers\Tenant\CustomerController::class, 'store'])->name('tenant.customers.store');
                Route::get('/customers/{customer}', [\App\Http\Controllers\Tenant\CustomerController::class, 'show'])->name('tenant.customers.show');
                Route::put('/customers/{customer}', [\App\Http\Controllers\Tenant\CustomerController::class, 'update'])->name('tenant.customers.update');
                Route::delete('/customers/{customer}', [\App\Http\Controllers\Tenant\CustomerController::class, 'destroy'])->name('tenant.customers.destroy');
            });

            // Service Management
            Route::middleware(['can:manage services'])->group(function () {
                // Service Categories
                Route::get('/services/categories', [\App\Http\Controllers\Tenant\ServiceCategoryController::class, 'index'])->name('tenant.service-categories.index');
                Route::post('/services/categories', [\App\Http\Controllers\Tenant\ServiceCategoryController::class, 'store'])->name('tenant.service-categories.store');
                Route::put('/services/categories/{serviceCategory}', [\App\Http\Controllers\Tenant\ServiceCategoryController::class, 'update'])->name('tenant.service-categories.update');
                Route::delete('/services/categories/{serviceCategory}', [\App\Http\Controllers\Tenant\ServiceCategoryController::class, 'destroy'])->name('tenant.service-categories.destroy');

                // Services
                Route::get('/services', [\App\Http\Controllers\Tenant\ServiceController::class, 'index'])->name('tenant.services.index');
                Route::post('/services', [\App\Http\Controllers\Tenant\ServiceController::class, 'store'])->name('tenant.services.store');
                Route::put('/services/{service}', [\App\Http\Controllers\Tenant\ServiceController::class, 'update'])->name('tenant.services.update');
                Route::delete('/services/{service}', [\App\Http\Controllers\Tenant\ServiceController::class, 'destroy'])->name('tenant.services.destroy');

                // Service Packages
                Route::get('/services/packages', [\App\Http\Controllers\Tenant\ServicePackageController::class, 'index'])->name('tenant.service-packages.index');
                Route::post('/services/packages', [\App\Http\Controllers\Tenant\ServicePackageController::class, 'store'])->name('tenant.service-packages.store');
                Route::put('/services/packages/{servicePackage}', [\App\Http\Controllers\Tenant\ServicePackageController::class, 'update'])->name('tenant.service-packages.update');
                Route::delete('/services/packages/{servicePackage}', [\App\Http\Controllers\Tenant\ServicePackageController::class, 'destroy'])->name('tenant.service-packages.destroy');
            });

            // Inventory Management
            Route::middleware(['can:manage services'])->group(function () {
                // Product Categories
                Route::get('/product-categories', [\App\Http\Controllers\Tenant\ProductCategoryController::class, 'index'])->name('tenant.product-categories.index');
                Route::post('/product-categories', [\App\Http\Controllers\Tenant\ProductCategoryController::class, 'store'])->name('tenant.product-categories.store');
                Route::put('/product-categories/{productCategory}', [\App\Http\Controllers\Tenant\ProductCategoryController::class, 'update'])->name('tenant.product-categories.update');
                Route::delete('/product-categories/{productCategory}', [\App\Http\Controllers\Tenant\ProductCategoryController::class, 'destroy'])->name('tenant.product-categories.destroy');

                // Brands
                Route::get('/brands', [\App\Http\Controllers\Tenant\BrandController::class, 'index'])->name('tenant.brands.index');
                Route::post('/brands', [\App\Http\Controllers\Tenant\BrandController::class, 'store'])->name('tenant.brands.store');
                Route::put('/brands/{brand}', [\App\Http\Controllers\Tenant\BrandController::class, 'update'])->name('tenant.brands.update');
                Route::delete('/brands/{brand}', [\App\Http\Controllers\Tenant\BrandController::class, 'destroy'])->name('tenant.brands.destroy');

                // Products & Logs
                Route::get('/inventory', [\App\Http\Controllers\Tenant\ProductController::class, 'index'])->name('tenant.inventory.index');
                Route::post('/inventory', [\App\Http\Controllers\Tenant\ProductController::class, 'store'])->name('tenant.inventory.store');
                Route::put('/inventory/{product}', [\App\Http\Controllers\Tenant\ProductController::class, 'update'])->name('tenant.inventory.update');
                Route::delete('/inventory/{product}', [\App\Http\Controllers\Tenant\ProductController::class, 'destroy'])->name('tenant.inventory.destroy');

                // Stock Adjustments
                Route::post('/inventory/{product}/adjust', [\App\Http\Controllers\Tenant\InventoryController::class, 'adjust'])->name('tenant.inventory.adjust');
            });

            // Appointments
            Route::middleware(['can:manage appointments'])->group(function () {
                Route::get('/appointments', [\App\Http\Controllers\Tenant\AppointmentController::class, 'index'])->name('tenant.appointments.index');
                Route::get('/appointments/create', [\App\Http\Controllers\Tenant\AppointmentController::class, 'create'])->name('tenant.appointments.create');
                Route::post('/appointments', [\App\Http\Controllers\Tenant\AppointmentController::class, 'store'])->name('tenant.appointments.store');
                Route::get('/appointments/{appointment}', [\App\Http\Controllers\Tenant\AppointmentController::class, 'show'])->name('tenant.appointments.show');
                Route::patch('/appointments/{appointment}/status', [\App\Http\Controllers\Tenant\AppointmentController::class, 'updateStatus'])->name('tenant.appointments.updateStatus');
                Route::delete('/appointments/{appointment}', [\App\Http\Controllers\Tenant\AppointmentController::class, 'destroy'])->name('tenant.appointments.destroy');
            });

            // POS & Billing
            Route::middleware(['can:manage billing'])->group(function () {
                Route::get('/pos', [\App\Http\Controllers\Tenant\PosController::class, 'index'])->name('tenant.pos.index');
                Route::post('/pos/checkout/{appointment}', [\App\Http\Controllers\Tenant\PosController::class, 'checkout'])->name('tenant.pos.checkout');
                Route::get('/invoices', [\App\Http\Controllers\Tenant\InvoiceController::class, 'index'])->name('tenant.invoices.index');
                Route::get('/invoices/{invoice}', [\App\Http\Controllers\Tenant\InvoiceController::class, 'show'])->name('tenant.invoices.show');
                Route::get('/invoices/{invoice}/pdf', [\App\Http\Controllers\Tenant\InvoiceController::class, 'downloadPdf'])->name('tenant.invoices.pdf');
            });

            // Reporting
            Route::middleware(['can:view reports'])->group(function () {
                Route::get('/reports', [\App\Http\Controllers\Tenant\ReportController::class, 'index'])->name('tenant.reports.index');
                Route::get('/reports/export', [\App\Http\Controllers\Tenant\ReportController::class, 'export'])->name('tenant.reports.export');
            });

            // Financial Management
            Route::middleware(['can:view reports'])->group(function () {
                Route::get('/financials', [\App\Http\Controllers\Tenant\FinancialController::class, 'index'])->name('tenant.financials.index');
                Route::get('/financials/export', [\App\Http\Controllers\Tenant\FinancialController::class, 'export'])->name('tenant.financials.export');
                
                // Expense Categories CRUD
                Route::post('/expense-categories', [\App\Http\Controllers\Tenant\ExpenseCategoryController::class, 'store'])->name('tenant.expense-categories.store');
                Route::put('/expense-categories/{expenseCategory}', [\App\Http\Controllers\Tenant\ExpenseCategoryController::class, 'update'])->name('tenant.expense-categories.update');
                Route::delete('/expense-categories/{expenseCategory}', [\App\Http\Controllers\Tenant\ExpenseCategoryController::class, 'destroy'])->name('tenant.expense-categories.destroy');

                // Expenses CRUD
                Route::post('/expenses', [\App\Http\Controllers\Tenant\ExpenseController::class, 'store'])->name('tenant.expenses.store');
                Route::put('/expenses/{expense}', [\App\Http\Controllers\Tenant\ExpenseController::class, 'update'])->name('tenant.expenses.update');
                Route::delete('/expenses/{expense}', [\App\Http\Controllers\Tenant\ExpenseController::class, 'destroy'])->name('tenant.expenses.destroy');

                // Collected Credit Payments
                Route::post('/credits/pay', [\App\Http\Controllers\Tenant\CreditPaymentController::class, 'store'])->name('tenant.credits.pay');
            });

            // Membership Plans & Subscriptions
            Route::middleware(['can:manage customers'])->group(function () {
                Route::get('/memberships', [\App\Http\Controllers\Tenant\MembershipPlanController::class, 'index'])->name('tenant.memberships.index');
                Route::post('/memberships', [\App\Http\Controllers\Tenant\MembershipPlanController::class, 'store'])->name('tenant.memberships.store');
                Route::put('/memberships/{membershipPlan}', [\App\Http\Controllers\Tenant\MembershipPlanController::class, 'update'])->name('tenant.memberships.update');
                Route::delete('/memberships/{membershipPlan}', [\App\Http\Controllers\Tenant\MembershipPlanController::class, 'destroy'])->name('tenant.memberships.destroy');
                Route::post('/memberships/assign/{customer}', [\App\Http\Controllers\Tenant\CustomerMembershipController::class, 'assign'])->name('tenant.memberships.assign');
                Route::post('/memberships/cancel/{customerMembership}', [\App\Http\Controllers\Tenant\CustomerMembershipController::class, 'cancel'])->name('tenant.memberships.cancel');
            });

            // Coupon Codes Management
            Route::middleware(['can:manage staff'])->group(function () {
                Route::get('/coupons', [\App\Http\Controllers\Tenant\CouponController::class, 'index'])->name('tenant.coupons.index');
                Route::post('/coupons', [\App\Http\Controllers\Tenant\CouponController::class, 'store'])->name('tenant.coupons.store');
                Route::put('/coupons/{coupon}', [\App\Http\Controllers\Tenant\CouponController::class, 'update'])->name('tenant.coupons.update');
                Route::delete('/coupons/{coupon}', [\App\Http\Controllers\Tenant\CouponController::class, 'destroy'])->name('tenant.coupons.destroy');
                Route::post('/coupons/validate', [\App\Http\Controllers\Tenant\CouponController::class, 'validateCode'])->name('tenant.coupons.validate');
            });

            // Attendance & Schedules
            Route::middleware(['auth'])->group(function () {
                Route::post('/attendance/clock-in', [\App\Http\Controllers\Tenant\AttendanceController::class, 'clockIn'])->name('tenant.attendance.clock-in');
                Route::post('/attendance/clock-out', [\App\Http\Controllers\Tenant\AttendanceController::class, 'clockOut'])->name('tenant.attendance.clock-out');
                Route::post('/leaves', [\App\Http\Controllers\Tenant\LeaveRequestController::class, 'store'])->name('tenant.leaves.store');
            });

            Route::middleware(['can:manage staff'])->group(function () {
                Route::get('/attendance', [\App\Http\Controllers\Tenant\AttendanceController::class, 'index'])->name('tenant.attendance.index');
                Route::post('/attendance/bulk-mark', [\App\Http\Controllers\Tenant\AttendanceController::class, 'markBulk'])->name('tenant.attendance.bulk-mark');

                // Staff Schedules
                Route::get('/staff/schedules', [\App\Http\Controllers\Tenant\StaffScheduleController::class, 'index'])->name('tenant.staff.schedules.index');
                Route::post('/staff/schedules/{user}', [\App\Http\Controllers\Tenant\StaffScheduleController::class, 'upsert'])->name('tenant.staff.schedules.upsert');

                // Leave Requests Approvals
                Route::post('/leaves/{leaveRequest}/approve', [\App\Http\Controllers\Tenant\LeaveRequestController::class, 'approve'])->name('tenant.leaves.approve');
                Route::post('/leaves/{leaveRequest}/reject', [\App\Http\Controllers\Tenant\LeaveRequestController::class, 'reject'])->name('tenant.leaves.reject');
            });
        });

        // Load Fortify Routes
        require base_path('vendor/laravel/fortify/routes/routes.php');
    });

    // Tenant API Routes
    Route::prefix('api')->middleware([
        InitializeTenancyByDomain::class,
        PreventAccessFromCentralDomains::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ])->group(function () {
        Route::post('/login', [\App\Http\Controllers\Api\TenantAuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [\App\Http\Controllers\Api\TenantAuthController::class, 'logout']);
            Route::get('/me', [\App\Http\Controllers\Api\TenantAuthController::class, 'me']);

            // Customer API
            Route::get('/customers', [\App\Http\Controllers\Api\CustomerApiController::class, 'index']);
            Route::post('/customers', [\App\Http\Controllers\Api\CustomerApiController::class, 'store']);
            Route::get('/customers/{customer}', [\App\Http\Controllers\Api\CustomerApiController::class, 'show']);
            Route::put('/customers/{customer}', [\App\Http\Controllers\Api\CustomerApiController::class, 'update']);

            // Service API
            Route::get('/services', [\App\Http\Controllers\Api\ServiceApiController::class, 'index']);
            Route::get('/service-categories', [\App\Http\Controllers\Api\ServiceApiController::class, 'categories']);
            Route::get('/service-packages', [\App\Http\Controllers\Api\ServiceApiController::class, 'packages']);

            // Appointment API
            Route::get('/appointments', [\App\Http\Controllers\Api\AppointmentApiController::class, 'index']);
            Route::post('/appointments', [\App\Http\Controllers\Api\AppointmentApiController::class, 'store']);
            Route::patch('/appointments/{appointment}/cancel', [\App\Http\Controllers\Api\AppointmentApiController::class, 'cancel']);
            Route::get('/available-slots', [\App\Http\Controllers\Api\AppointmentApiController::class, 'availableTimeSlots']);

            // Invoice API
            Route::get('/invoices', [\App\Http\Controllers\Api\InvoiceApiController::class, 'index']);
            Route::get('/invoices/{invoice}', [\App\Http\Controllers\Api\InvoiceApiController::class, 'show']);
        });
    });
});
