import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import { QrCode, Camera, AlertCircle, Loader2, Users, X } from 'lucide-react';
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
  const { mySchedule, partnerSchedule, setPartnerSchedule, myShareCode, setMyShareCode, partnerCode, setPartnerCode } = useStore();
  
  const [inputCode, setInputCode] = useState(partnerCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentWeek = getCurrentWeek(mySchedule.settings.semesterStartDate);
  const today = formatDate(new Date());

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

  // 开启摄像头扫描
  const startScanner = async () => {
    setShowScanner(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        // 开始扫描
        requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      setError('无法访问摄像头，请检查权限设置');
      setShowScanner(false);
    }
  };

  // 扫描二维码
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !showScanner) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // 解析二维码内容
      const url = code.data;
      const match = url.match(/partner=([A-Z0-9]{6})/);
      if (match) {
        const partnerCode = match[1];
        stopScanner();
        loadPartner(partnerCode);
      } else {
        setError('无效的配对二维码');
      }
    } else {
      requestAnimationFrame(scanQRCode);
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
    <div className="h-full flex flex-col relative">
      {/* 左上角日期和教学周信息 */}
      <div className="absolute top-4 left-4 z-20 flat-card px-4 py-2 rounded-xl shadow-sm">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{today}</div>
        {currentWeek !== null && mySchedule.settings.totalWeeks && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            第 {currentWeek} 周 / 共 {mySchedule.settings.totalWeeks} 周
          </div>
        )}
      </div>

      {/* 分享按钮 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {!myShareCode ? (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flat-button flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            生成配对二维码
          </button>
        ) : (
          <button
            onClick={handleShowQRCode}
            className="flat-button flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <QrCode className="w-4 h-4" />
            显示我的二维码
          </button>
        )}
      </div>

      {/* 二维码显示模态框 */}
      {showQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowQRCode(false)}>
          <div className="flat-modal rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">我的配对二维码</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="flat-button p-2 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl mb-4">
              <img src={qrCodeUrl} alt="配对二维码" className="w-full h-auto" />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
              让TA扫描此二维码即可配对
            </p>
            <p className="text-xs text-center font-mono font-bold text-gray-500 dark:text-gray-500">
              邀请码: {myShareCode}
            </p>
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
            <div className="relative bg-black rounded-xl overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-auto"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-emerald-500 m-8 rounded-xl pointer-events-none" />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              将二维码对准扫描框
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        <div className="flex-1 min-h-0 flex flex-col pt-20">
          <div className="flat-card flex flex-wrap items-center justify-between p-3 md:p-4 rounded-xl shadow-sm gap-2 shrink-0 mb-3 mx-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">我的课程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-400 border border-pink-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">TA的课程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">共同空闲</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400 border border-purple-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">一起上课</span>
              </div>
            </div>
            <button
              onClick={() => {
                setPartnerSchedule(null);
                setPartnerCode(null);
              }}
              className="flat-button text-xs md:text-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:scale-105 transition-all ml-auto"
            >
              断开连接
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ScheduleGrid
              courses={mySchedule.courses}
              partnerCourses={partnerSchedule.courses}
              mode="couple"
              currentWeek={currentWeek}
            />
          </div>
        </div>
      )}
    </div>
  );
}
