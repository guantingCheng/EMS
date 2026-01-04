import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Plus, AlertCircle, TrendingUp, Calendar, Wrench } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // 獲取庫存統計
  const { data: inventoryStats, isLoading: statsLoading } = trpc.analytics.getInventoryStats.useQuery();

  // 獲取工具使用率統計
  const { data: toolUsageStats, isLoading: usageLoading } = trpc.analytics.getToolUsageStats.useQuery();

  // 獲取需要維護的工具
  const { data: toolsNeedingMaintenance, isLoading: maintenanceLoading } = trpc.analytics.getToolsNeedingMaintenance.useQuery();

  // 獲取借用趨勢
  const { data: borrowTrends, isLoading: trendsLoading } = trpc.analytics.getBorrowTrends.useQuery();

  const isLoading = statsLoading || usageLoading || maintenanceLoading || trendsLoading;

  const chartData = toolUsageStats
    ? toolUsageStats.slice(0, 5).map((tool) => ({
        name: tool.name,
        utilization: parseFloat(tool.utilizationRate),
      }))
    : [];

  const pieData = inventoryStats
    ? [
        { name: "可用", value: inventoryStats.availableQuantity },
        { name: "借用中", value: inventoryStats.borrowedQuantity },
      ]
    : [];

  const COLORS = ["#3b82f6", "#ef4444"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">庫存儀表板</h1>
            <p className="text-muted-foreground mt-2">歡迎回來，{user?.name}。這是您的工具庫存概覽。</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/tools/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              新增工具
            </Button>
            <Button onClick={() => navigate("/borrow-multi")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              多項借用
            </Button>
            <Button onClick={() => navigate("/tool-schedule")} variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              排程表
            </Button>
          </div>
        </div>

        {/* 統計卡片 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* 工具總數 */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">工具總數</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryStats?.totalTools || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>

              {/* 總庫存 */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">總庫存</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryStats?.totalQuantity || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>

              {/* 可用數量 */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">可用數量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryStats?.availableQuantity || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>

              {/* 借用中 */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">借用中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryStats?.borrowedQuantity || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>
            </div>

            {/* 關鍵指標 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* 使用率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    庫存使用率
                  </CardTitle>
                  <CardDescription>整體工具使用率</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold">{inventoryStats?.utilizationRate}%</div>
                    <Badge variant={parseFloat(inventoryStats?.utilizationRate || "0") > 70 ? "destructive" : "secondary"}>
                      {parseFloat(inventoryStats?.utilizationRate || "0") > 70 ? "高使用率" : "正常"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 活躍借用 */}
              <Card>
                <CardHeader>
                  <CardTitle>活躍借用記錄</CardTitle>
                  <CardDescription>當前借用中的記錄數</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{inventoryStats?.activeBorrowCount || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* 圖表區域 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* 工具使用率排行 */}
              <Card>
                <CardHeader>
                  <CardTitle>工具使用率排行</CardTitle>
                  <CardDescription>前5個使用率最高的工具</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="utilization" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">暫無數據</div>
                  )}
                </CardContent>
              </Card>

              {/* 庫存分布 */}
              <Card>
                <CardHeader>
                  <CardTitle>庫存分布</CardTitle>
                  <CardDescription>可用 vs 借用中</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 && pieData[0].value + pieData[1].value > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">暫無數據</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 需要維護的工具 */}
            {toolsNeedingMaintenance && toolsNeedingMaintenance.length > 0 && (
              <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    需要維護的工具
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-400">
                    以下工具已達到維護週期或使用次數閾值
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {toolsNeedingMaintenance.slice(0, 5).map((tool: any) => (
                      <div key={tool.id} className="flex items-center justify-between p-2 bg-white dark:bg-red-900 rounded">
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-300">{tool.name}</p>
                          <p className="text-sm text-red-600 dark:text-red-400">使用次數: {tool.usageCount}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/maintenance`)}>
                          查看詳情
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
