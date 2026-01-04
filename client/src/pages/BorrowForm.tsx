import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function BorrowForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedToolId, setSelectedToolId] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");

  // 獲取所有工具
  const { data: tools, isLoading: toolsLoading } = trpc.tools.list.useQuery();

  // 建立借用記錄
  const createBorrow = trpc.borrow.create.useMutation({
    onSuccess: () => {
      toast.success("借用記錄已建立");
      navigate("/borrow-history");
    },
    onError: (error) => {
      toast.error(error.message || "建立失敗");
    },
  });

  const selectedTool = tools?.find((t) => t.id === selectedToolId);
  const maxQuantity = selectedTool?.availableQuantity || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedToolId) {
      toast.error("請選擇工具");
      return;
    }

    if (quantity <= 0 || quantity > maxQuantity) {
      toast.error(`請輸入有效的數量（1-${maxQuantity}）`);
      return;
    }

    createBorrow.mutate({
      toolId: selectedToolId,
      quantity,
      expectedReturnTime: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
      notes,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* 頁面標題 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/borrow-history")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">工具借用</h1>
            <p className="text-muted-foreground mt-2">登記您要借用的工具</p>
          </div>
        </div>

        {/* 借用表單 */}
        <Card>
          <CardHeader>
            <CardTitle>借用資訊</CardTitle>
            <CardDescription>填寫以下資訊以登記工具借用</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 借用人資訊 */}
              <div className="space-y-2">
                <Label>借用人</Label>
                <Input value={user?.name || ""} disabled className="bg-muted" />
              </div>

              {/* 工具選擇 */}
              <div className="space-y-2">
                <Label htmlFor="tool">工具 *</Label>
                {toolsLoading ? (
                  <div className="flex items-center gap-2 p-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    載入中...
                  </div>
                ) : (
                  <select
                    id="tool"
                    value={selectedToolId || ""}
                    onChange={(e) => setSelectedToolId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    required
                  >
                    <option value="">選擇工具</option>
                    {tools
                      ?.filter((t) => t.availableQuantity > 0)
                      .map((tool) => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name} (可用: {tool.availableQuantity})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* 工具詳情 */}
              {selectedTool && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">類別</p>
                    <p className="font-medium">{selectedTool.category}</p>
                  </div>
                  {selectedTool.specification && (
                    <div>
                      <p className="text-sm text-muted-foreground">規格</p>
                      <p className="font-medium">{selectedTool.specification}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">可用數量</p>
                    <p className="font-medium text-green-600">{selectedTool.availableQuantity}</p>
                  </div>
                </div>
              )}

              {/* 借用數量 */}
              <div className="space-y-2">
                <Label htmlFor="quantity">借用數量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                  disabled={!selectedTool}
                />
                {selectedTool && (
                  <p className="text-sm text-muted-foreground">
                    最多可借用: {maxQuantity} 件
                  </p>
                )}
              </div>

              {/* 預計歸還日期 */}
              <div className="space-y-2">
                <Label htmlFor="returnDate">預計歸還日期</Label>
                <Input
                  id="returnDate"
                  type="datetime-local"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                />
              </div>

              {/* 備註 */}
              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  placeholder="輸入任何相關備註..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* 提交按鈕 */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/borrow-history")}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createBorrow.isPending}
                >
                  {createBorrow.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "提交借用"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
