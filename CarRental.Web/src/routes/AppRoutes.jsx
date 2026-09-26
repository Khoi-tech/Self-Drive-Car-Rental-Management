import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import VehiclesPage from '../pages/Vehicles/VehiclesPage';
import CreateVehiclePage from '../pages/Vehicles/CreateVehiclePage';
import VehicleDetailPage from '../pages/Vehicles/VehicleDetailPage';
import EditVehiclePage from '../pages/Vehicles/EditVehiclePage';
import PricingPage from '../pages/Pricing/PricingPage';
import PricingDetailPage from '../pages/Pricing/PricingDetailPage';
import PoliciesPage from '../pages/Policies/PoliciesPage';
import CompensationPoliciesPage from '../pages/Compensation/CompensationPoliciesPage';
import ContractTemplatesPage from '../pages/Contracts/ContractTemplatesPage';

import CarCatalogPage from '../pages/Catalog/CarCatalogPage';

import CarDetailPage from '../pages/Catalog/CarDetailPage';
import BookingPage from '../pages/Booking/BookingPage';

// Placeholder component for pages not yet implemented
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <div className="text-center">
      <h2 className="text-2xl font-light mb-2">{title}</h2>
      <p className="text-gray-500">Sắp ra mắt</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/cars" element={<CarCatalogPage />} />
      <Route path="/cars/:id" element={<CarDetailPage />} />
      <Route path="/booking/:carId" element={<BookingPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/create" element={<CreateVehiclePage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="vehicles/:id/edit" element={<EditVehiclePage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="pricing/:vehicleId" element={<PricingDetailPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="compensation" element={<CompensationPoliciesPage />} />
        <Route path="contracts" element={<ContractTemplatesPage />} />
        <Route path="settings" element={<PlaceholderPage title="Cài đặt" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
