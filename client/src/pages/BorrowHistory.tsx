import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, RotateCcw, CheckCircle2, ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { exportBorrowRecordsToExcel, generateExcelFilename } from "@/lib/excelExport";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BorrowHistory() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedBorrowId, setSelectedBorrowId] = useState<number | undefined>();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState<"good" | "minor_damage" | "major_damage">("good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [quickReturnIds, setQuickReturnIds] = useState<number[]>([]);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportProjectName, setExportProjectName] = useState("");

  // 獲取活躍借用記錄
  const { data: activeBorrows, isLoading, refetch } = trpc.borrow.getActive.useQuery();
  const { data: tools } = trpc.tools.list.useQuery();

  // 建立歸還記錄
  const returnMutation = trpc.return.create.useMutation({
    onSuccess: () => {
      toast.success("工具已歸還");
      setShowReturnForm(false);
      setSelectedBorrowId(undefined);
      setQuickReturnIds([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "歸還失敗");
    },
  });

  // 快速歸還函數
  const handleQuickReturn = (borrowId: number) => {
    const borrow = activeBorrows?.find(b => b.id === borrowId);
    if (!borrow) return;

    returnMutation.mutate({
      borrowRecordId: borrowId,
      quantity: borrow.quantity,
      condition: "good",
    });
  };

  // 處理快速歸還勾選
  const handleQuickReturnToggle = (borrowId: number) => {
    setQuickReturnIds(prev =>
      prev.includes(borrowId)
        ? prev.filter(id => id !== borrowId)
        : [...prev, borrowId]
    );
  };

  // 批量歸還
  const handleBatchReturn = () => {
    if (quickReturnIds.length === 0) {
      toast.error("請選擇要還回的工具");
      return;
    }

    quickReturnIds.forEach(borrowId => {
      handleQuickReturn(borrowId);
    });
  };

  const exportMutation = trpc.export.borrowRecords.useQuery(
    {
      startDate: exportStartDate ? new Date(exportStartDate) : undefined,
      endDate: exportEndDate ? new Date(exportEndDate) : undefined,
      projectName: exportProjectName || undefined,
      status: "all",
    },
    { enabled: false }
  );

  const handleExport = async () => {
    if (!exportStartDate && !exportEndDate && !exportProjectName) {
      toast.error("請選擇至少一個篩選條件");
      return;
    }

    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const filename = generateExcelFilename(exportProjectName);
        exportBorrowRecordsToExcel(result.data, filename);
        toast.success("匯出成功");
      }
    } catch (error) {
      toast.error("匯出失敗");
    }
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBorrowId) {
      toast.error("請選擇借用記錄");
      return;
    }

    const borrow = activeBorrows?.find((b) => b.id === selectedBorrowId);
    if (!borrow) {
      toast.error("找不到借用記錄");
      return;
    }

    returnMutation.mutate({
      borrowRecordId: selectedBorrowId,
      quantity: borrow.quantity,
      condition: selectedCondition,
      conditionNotes: conditionNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "borrowed":
        return <Badge className="bg-orange-500">借用中</Badge>;
      case "returned":
        return <Badge className="bg-green-500">已歸還</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">逾期</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">借用管理</h1>
            <p className="text-muted-foreground mt-2">查看和管理工具借用記錄</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/borrow-form")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              單項借用
            </Button>
            <Button onClick={() => navigate("/borrow-multi")} className="gap-2">
              <Plus className="w-4 h-4" />
              多項借用
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  匯出Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>匯出借用記錄</DialogTitle>
                  <DialogDescription>選擇篩選條件並匯出為Excel檔案</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>開始日期</Label>
                    <Input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>結束日期</Label>
                    <Input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>案場名稱</Label>
                    <Input
                      placeholder="輸入案場名稱"
                      value={exportProjectName}
                      onChange={(e) => setExportProjectName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={exportMutation.isLoading}
                    className="w-full gap-2"
                  >
                    {exportMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    匯出
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 活躍借用記錄 */}
        <Card>
          <CardHeader>
            <CardTitle>活躍借用記錄</CardTitle>
            <CardDescription>當前借用中的工具</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !activeBorrows || activeBorrows.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暫無活躍借用記錄</p>
            ) : (
              <div className="space-y-4">
                {/* 快速歸還控制板 */}
                {quickReturnIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">已選擇 {quickReturnIds.length} 項工具要歸還</span>
                      <Button
                        size="sm"
                        onClick={handleBatchReturn}
                        disabled={returnMutation.isPending}
                        className="gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        確認歸還
                      </Button>
                    </div>
                  </div>
                )}

                {/* 借用記錄列表 */}
                <div className="space-y-3">
                  {activeBorrows.map((borrow) => {
                    const tool = tools?.find((t) => t.id === borrow.toolId);
                    const isSelected = quickReturnIds.includes(borrow.id);
                    return (
                      <Card key={borrow.id} className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-300" : "hover:bg-muted/50"
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          {/* 快速歸還勾選 */}
                          <div className="flex items-start pt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleQuickReturnToggle(borrow.id)}
                              className="mt-1"
                            />
                          </div>

                          {/* 工具資訊 */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{tool?.name || `工具 #${borrow.toolId}`}</p>
                              {getStatusBadge(borrow.status)}
                            </div>
                            {borrow.projectName && (
                              <p className="text-sm text-muted-foreground">案場: {borrow.projectName}</p>
                            )}
                            <p className="text-sm text-muted-foreground">借用人: {borrow.borrowerName}</p>
                            <p className="text-sm text-muted-foreground">借用數量: {borrow.quantity}</p>
                            <p className="text-sm text-muted-foreground">
                              借用時間: {new Date(borrow.borrowTime).toLocaleString()}
                            </p>
                          </div>

                          {/* 操作按鈕 */}
                          <Dialog open={showReturnForm && selectedBorrowId === borrow.id} onOpenChange={setShowReturnForm}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedBorrowId(borrow.id);
                                  setReturnQuantity(borrow.quantity);
                                  setShowReturnForm(true);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                詳細歸還
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>詳細歸還</DialogTitle>
                                <DialogDescription>
                                  登記工具歸還資訊
                                </DialogDescription>
                              </DialogHeader>

                              {selectedBorrowId === borrow.id && (
                                <form onSubmit={handleReturnSubmit} className="space-y-4">
                                  {/* 借用資訊 */}
                                  <div className="bg-muted p-3 rounded space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">借用人:</span> {borrow.borrowerName}</p>
                                    <p><span className="text-muted-foreground">工具:</span> {tool?.name || `工具 #${borrow.toolId}`}</p>
                                    <p><span className="text-muted-foreground">借用數量:</span> {borrow.quantity}</p>
                                    {borrow.projectName && (
                                      <p><span className="text-muted-foreground">案場:</span> {borrow.projectName}</p>
                                    )}
                                  </div>

                                  {/* 工具狀況 */}
                                  <div className="space-y-2">
                                    <Label>工具狀況 *</Label>
                                    <div className="space-y-2">
                                      {(["good", "minor_damage", "major_damage"] as const).map((condition) => (
                                        <div key={condition} className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            id={condition}
                                            name="condition"
                                            value={condition}
                                            checked={selectedCondition === condition}
                                            onChange={(e) => setSelectedCondition(e.target.value as any)}
                                            className="w-4 h-4"
                                          />
                                          <Label htmlFor={condition} className="cursor-pointer">
                                            {{
                                              good: "良好",
                                              minor_damage: "輕微損傷",
                                              major_damage: "嚴重損傷",
                                            }[condition]}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 狀況備註 */}
                                  <div className="space-y-2">
                                    <Label htmlFor="conditionNotes">狀況備註</Label>
                                    <Textarea
                                      id="conditionNotes"
                                      placeholder="輸入任何損傷或問題..."
                                      value={conditionNotes}
                                      onChange={(e) => setConditionNotes(e.target.value)}
                                      rows={2}
                                    />
                                  </div>

                                  {/* 提交按鈕 */}
                                  <div className="flex gap-2 justify-end pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowReturnForm(false)}
                                    >
                                      取消
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={returnMutation.isPending}
                                    >
                                      {returnMutation.isPending ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          提交中...
                                        </>
                                      ) : (
                                        "確認歸還"
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
