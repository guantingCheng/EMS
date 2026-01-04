import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, Users, Wrench, Search } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">木作裝潢工具管理</h1>
            <p className="text-gray-600">專業的工具庫存管理系統</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <p className="text-gray-700">
              歡迎使用木作裝潢工具管理系統。請登入以繼續。
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="w-full h-12 text-lg"
            >
              登入
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 導航欄 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">工具管理系統</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">歡迎，{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* 標題 */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">工具庫存管理系統</h2>
            <p className="text-gray-600">輕鬆管理您的工具借用、歸還和維護</p>
          </div>

          {/* 功能卡片 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 儀表板 */}
            <div
              onClick={() => navigate("/dashboard")}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow space-y-4"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">庫存儀表板</h3>
                <p className="text-sm text-gray-600 mt-1">查看庫存概覽和統計資訊</p>
              </div>
            </div>

            {/* 工具管理 */}
            <div
              onClick={() => navigate("/tools")}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow space-y-4"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">工具管理</h3>
                <p className="text-sm text-gray-600 mt-1">管理工具庫存和詳細資訊</p>
              </div>
            </div>

            {/* 搜尋工具 */}
            <div
              onClick={() => navigate("/tools/search")}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow space-y-4"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">搜尋工具</h3>
                <p className="text-sm text-gray-600 mt-1">快速搜尋和篩選工具</p>
              </div>
            </div>

            {/* 借用管理 */}
            <div
              onClick={() => navigate("/borrow-history")}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow space-y-4"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">借用管理</h3>
                <p className="text-sm text-gray-600 mt-1">記錄和管理工具借用</p>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">快速操作</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                onClick={() => navigate("/borrow-form")}
                className="h-12"
              >
                新增借用
              </Button>
              <Button
                onClick={() => navigate("/tools/new")}
                variant="outline"
                className="h-12"
              >
                新增工具
              </Button>
              <Button
                onClick={() => navigate("/maintenance")}
                variant="outline"
                className="h-12"
              >
                維護管理
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
