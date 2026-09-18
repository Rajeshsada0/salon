<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePackage;

class ServiceApiController extends Controller
{
    /**
     * Display all active services with their category.
     */
    public function index()
    {
        $services = Service::with('serviceCategory')
            ->where('is_active', true)
            ->get()
            ->groupBy('service_category_id');

        return response()->json(['services' => $services]);
    }

    /**
     * Display all active service categories.
     */
    public function categories()
    {
        $categories = ServiceCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    /**
     * Display all active service packages with their included services.
     */
    public function packages()
    {
        $packages = ServicePackage::with('services')
            ->where('is_active', true)
            ->get();

        return response()->json(['packages' => $packages]);
    }
}
