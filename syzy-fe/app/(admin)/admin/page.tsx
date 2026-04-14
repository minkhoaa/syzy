"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigStatusCard } from "./_components/config-status-card";
import { InitializeMasterCard } from "./_components/initialize-master-card";
import { ShieldedPoolCard } from "./_components/shielded-pool-card";
import { AdminManagementCard } from "./_components/admin-management-card";
import { TeeRegistryCard } from "./_components/tee-registry-card";
import { ProductMetricsCard } from "./_components/product-metrics-card";
import { BarChart3, FileCode, Satellite } from "lucide-react";
import { OracleDashboard } from "./_components/oracle-dashboard";

export default function AdminPage() {
  return (
    <RequireAdmin>
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage contract configuration and ZK pools
          </p>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="oracles" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              Oracles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid gap-6">
              <ProductMetricsCard />
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="grid gap-6 md:grid-cols-2">
              <ConfigStatusCard />
              <InitializeMasterCard />
              <ShieldedPoolCard />
              <AdminManagementCard />
              <TeeRegistryCard />
            </div>
          </TabsContent>

          <TabsContent value="oracles">
            <OracleDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </RequireAdmin>
  );
}
