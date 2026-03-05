import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import { QrCode, Camera, AlertCircle, Loader2, Users, X, HelpCircle, ChevronLeft, ChevronRight, Settings, User, LogOut } from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

// 计算当前教学周
const getCurrentWeek = (semesterStartDate?: string): number | null => {
  if (!semesterStartDate) return null;
  const start = new Date(semesterStartDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return week > 0 ? week : null;
};

// 格式化日期
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekDay}`;
};

export default function CouplePage() {
  const { mySchedule, partnerSchedule, setPartnerSchedule, myShareCode, setMyShareCode, partnerCode, setPartnerCode, user } = useStore();
  const { setIsSettingsOpen, handleLogout } = useOutletContext<{ 
    setIsSettingsOpen: (open: boolean) => void;
    handleLogout: () => void;
  }>();
  
  const [inputCode, setInputCode] = useState(partnerCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentWeek = getCurrentWeek(mySchedule.settings.semesterStartDate);
  const [viewingWeek, setViewingWeek] = useState<number>(currentWeek || 1);
  const today = formatDate(new Date());

  // 触摸滑动相关
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const scheduleContainerRef = useRef<HTMLDivElement>(null);

  // 当currentWeek变化时，更新viewingWeek
  useEffect(() => {
    if (currentWeek !== null) {
      setViewingWeek(currentWeek);
    }
  }, [currentWeek]);

  const handleTouchStart = (e: TouchEvent | React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent | React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNextWeek();
      } else {
        handlePrevWeek();
      }
    }
  };

  const handlePrevWeek = () => {
    setViewingWeek(prev => Math.max(1, prev - 1));
  };

  const handleNextWeek = () => {
    const maxWeek = mySchedule.settings.totalWeeks || 20;
    setViewingWeek(prev => Math.min(maxWeek, prev + 1));
  };

  const handleBackToCurrentWeek = () => {
    if (currentWeek !== null) {
      setViewingWeek(currentWeek);
    }
  };

  // Generate my share code and save to backend
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const id = myShareCode || Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data: mySchedule })
      });
      if (res.ok) {
        setMyShareCode(id);
        // 生成二维码
        const url = `${window.location.origin}/couple?partner=${id}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
        setShowQRCode(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  // 显示已有的二维码
  const handleShowQRCode = async () => {
    if (!myShareCode) return;
    const url = `${window.location.origin}/couple?partner=${myShareCode}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    setQrCodeUrl(qrDataUrl);
    setShowQRCode(true);
  };

  // 复制邀请码
  const handleCopyCode = async () => {
    if (!myShareCode) return;
    try {
      await navigator.clipboard.writeText(myShareCode);
      alert('✅ 邀请码已复制到剪贴板');
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = myShareCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ 邀请码已复制到剪贴板');
    }
  };

  // 复制分享链接
  const handleCopyLink = async () => {
    if (!myShareCode) return;
    const url = `${window.location.origin}/couple?partner=${myShareCode}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('✅ 分享链接已复制到剪贴板\n\n发送给TA，点击即可配对');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ 分享链接已复制到剪贴板\n\n发送给TA，点击即可配对');
    }
  };

  // 开启摄像头扫描
  const startScanner = async () => {
    setShowScanner(true);
    setError('');
    
    // 检查是否支持 Barcode Detection API
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanWithBarcodeAPI(barcodeDetector);
        }
        return;
      } catch (err) {
        // 降级到 jsQR
      }
    }
    
    // 使用 jsQR 作为降级方案
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        videoRef.current.onloadedmetadata = () => {
          requestAnimationFrame(scanQRCode);
        };
      }
    } catch (err) {
      setError('无法访问摄像头，请使用文件上传方式');
      setShowScanner(false);
    }
  };

  // 使用 Barcode Detection API 扫描
  const scanWithBarcodeAPI = async (detector: any) => {
    if (!videoRef.current || !showScanner) return;

    try {
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const url = barcodes[0].rawValue;
        const match = url.match(/partner=([A-Z0-9]{6})/);
        if (match) {
          const partnerCode = match[1];
          stopScanner();
          loadPartner(partnerCode);
          return;
        } else {
          setError('无效的配对二维码');
          stopScanner();
          return;
        }
      }
    } catch (err) {
      // 继续扫描
    }

    requestAnimationFrame(() => scanWithBarcodeAPI(detector));
  };

  // 扫描二维码（jsQR 降级方案）
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !showScanner) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    // 设置canvas尺寸
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 绘制当前帧
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 尝试识别二维码
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // 解析二维码内容
        const url = code.data;
        const match = url.match(/partner=([A-Z0-9]{6})/);
        if (match) {
          const partnerCode = match[1];
          stopScanner();
          loadPartner(partnerCode);
          return;
        } else {
          setError('无效的配对二维码');
          stopScanner();
          return;
        }
      }
    } catch (err) {
      // 继续扫描
    }

    // 继续下一帧
    requestAnimationFrame(scanQRCode);
  };

  // 从图片文件扫描二维码
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    try {
      // 检查是否支持 Barcode Detection API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const imageBitmap = await createImageBitmap(file);
        const barcodes = await barcodeDetector.detect(imageBitmap);
        
        if (barcodes.length > 0) {
          const url = barcodes[0].rawValue;
          const match = url.match(/partner=([A-Z0-9]{6})/);
          if (match) {
            const partnerCode = match[1];
            loadPartner(partnerCode);
            return;
          }
        }
      }
      
      // 降级到 jsQR
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const context = canvas.getContext('2d');
          
          if (context) {
            context.drawImage(img, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              const url = code.data;
              const match = url.match(/partner=([A-Z0-9]{6})/);
              if (match) {
                const partnerCode = match[1];
                loadPartner(partnerCode);
                return;
              }
            }
          }
          
          setError('无法识别二维码，请重试');
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('二维码识别失败，请重试');
    }
  };

  // 停止摄像头
  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowScanner(false);
  };

  // Load partner schedule
  const loadPartner = async (code: string) => {
    if (!code) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/schedules/${code}`);
      if (!res.ok) throw new Error('未找到课表');
      const { data } = await res.json();
      setPartnerSchedule(data);
      setPartnerCode(code);
    } catch (err) {
      setError('无法加载伴侣课表，请检查邀请码。');
      setPartnerSchedule(null);
      setPartnerCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partnerCode && !partnerSchedule) {
      loadPartner(partnerCode);
    }
  }, [partnerCode]);

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部信息栏容器 */}
      <div className="mx-4 mt-2 mb-2 p-2 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 日期和教学周信息 */}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{today}</div>
            {currentWeek !== null && mySchedule.settings.totalWeeks && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                当前第 {currentWeek} 周 / 共 {mySchedule.settings.totalWeeks} 周
              </div>
            )}
          </div>

          {/* 周数切换控制 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevWeek}
              disabled={viewingWeek <= 1}
              className="flat-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="上一周"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex flex-col items-center min-w-[60px]">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                第 {viewingWeek} 周
              </div>
              {viewingWeek !== currentWeek && currentWeek !== null && (
                <button
                  onClick={handleBackToCurrentWeek}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline leading-tight"
                >
                  回到本周
                </button>
              )}
            </div>

            <button
              onClick={handleNextWeek}
              disabled={viewingWeek >= (mySchedule.settings.totalWeeks || 20)}
              className="flat-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="下一周"
            >
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* 设置按钮和菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flat-button p-1.5 rounded-lg transition-all"
              title="菜单"
            >
              <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            {/* 下拉菜单 */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 flat-modal rounded-xl shadow-lg z-50 py-2">
                  {/* 用户信息 */}
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                  </div>
                  
                  {/* 生成/显示二维码 */}
                  {!myShareCode ? (
                    <button
                      onClick={() => {
                        handleShare();
                        setShowMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      生成配对二维码
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleShowQRCode();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <QrCode className="w-4 h-4" />
                      显示我的二维码
                    </button>
                  )}
                  
                  {/* 图例（仅在已配对时显示） */}
                  {partnerSchedule && (
                    <button
                      onClick={() => {
                        setShowLegend(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <HelpCircle className="w-4 h-4" />
                      查看图例
                    </button>
                  )}
                  
                  {/* 课表设置 */}
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    课表设置
                  </button>
                  
                  {/* 登出按钮 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 二维码显示模态框 */}
      {showQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowQRCode(false)}>
          <div className="flat-modal rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">配对信息</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="flat-button p-2 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* 邀请码 */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">邀请码</p>
              <p className="text-3xl font-bold text-center font-mono text-blue-600 dark:text-blue-400 tracking-wider">
                {myShareCode}
              </p>
              <button
                onClick={handleCopyCode}
                className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-all"
              >
                📋 复制邀请码
              </button>
            </div>

            {/* 分享链接 */}
            <div className="mb-4">
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/couple?partner=${myShareCode}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: '情侣课表配对',
                        text: `我的配对邀请码：${myShareCode}`,
                        url: url
                      });
                    } catch (err) {
                      handleCopyLink();
                    }
                  } else {
                    handleCopyLink();
                  }
                }}
                className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-all"
              >
                🔗 分享配对链接
              </button>
            </div>

            {/* 二维码 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">或扫描二维码</p>
              <div className="bg-white p-3 rounded-xl">
                <img src={qrCodeUrl} alt="配对二维码" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 扫码器模态框 */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="flat-modal rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">扫描配对二维码</h3>
              <button
                onClick={stopScanner}
                className="flat-button p-2 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden mb-4 aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* 扫描框 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-emerald-500 rounded-xl relative">
                  {/* 四个角的装饰 */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
              将二维码对准扫描框
            </p>
            {error && (
              <p className="text-xs text-center text-red-600 dark:text-red-400 mb-2">
                {error}
              </p>
            )}
            
            {/* 上传图片选项 */}
            <div className="mb-4">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flat-button w-full px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  📷 从相册选择二维码图片
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-500 dark:text-gray-500 mb-3">
                或手动输入邀请码
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="输入6位邀请码"
                  className="flat-input flex-1 px-4 py-2 rounded-xl font-mono uppercase text-center text-sm"
                  maxLength={6}
                />
                <button
                  onClick={() => {
                    stopScanner();
                    loadPartner(inputCode);
                  }}
                  disabled={inputCode.length < 6}
                  className="px-4 py-2 font-semibold rounded-xl text-white text-sm shadow-md transition-all disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600"
                >
                  连接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!partnerSchedule ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flat-modal p-8 md:p-10 rounded-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">连接伴侣课表</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
              扫描TA的二维码，或手动输入邀请码，即可实时同步你们的课表。
            </p>
            
            <button
              onClick={startScanner}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 mb-4 font-semibold rounded-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
            >
              <Camera className="w-5 h-5" />
              扫描二维码配对
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">或</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="输入6位邀请码"
                className="flat-input flex-1 px-4 py-3 rounded-xl font-mono uppercase text-center min-w-0"
                maxLength={6}
              />
              <button
                onClick={() => loadPartner(inputCode)}
                disabled={isLoading || inputCode.length < 6}
                className="px-5 md:px-7 py-3 font-semibold rounded-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 shrink-0 bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '连接'}
              </button>
            </div>
            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* 图例模态框 */}
          {showLegend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowLegend(false)}>
              <div className="flat-modal rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">课表图例</h3>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="flat-button p-2 rounded-xl"
                  >
                    <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">我的课程</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">只有你有课的时间段</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-pink-400 border border-pink-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">TA的课程</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">只有TA有课的时间段</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-purple-400 border border-purple-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">一起上课 ✨</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">你们同时上同一门课</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">共同空闲</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">你们都没有课的时间段</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setPartnerSchedule(null);
                      setPartnerCode(null);
                      setShowLegend(false);
                    }}
                    className="w-full flat-button text-sm text-red-600 dark:text-red-400 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    断开连接
                  </button>
                </div>
              </div>
            </div>
          )}

          <div 
            ref={scheduleContainerRef}
            className="flex-1 min-h-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ScheduleGrid
              courses={mySchedule.courses}
              partnerCourses={partnerSchedule.courses}
              mode="couple"
              currentWeek={viewingWeek}
            />
          </div>
        </div>
      )}
    </div>
  );
}
