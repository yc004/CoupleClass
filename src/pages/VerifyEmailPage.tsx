import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('验证令牌无效');
      return;
    }

    // 验证邮箱
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || '邮箱验证成功！');
        } else {
          setStatus('error');
          setMessage(data.error || '验证失败');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('验证失败，请稍后重试');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flat-modal rounded-2xl p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              正在验证邮箱...
            </h2>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              验证成功！
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <Link
              to="/login"
              className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
            >
              前往登录
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              验证失败
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <div className="flex gap-3 mt-4">
              <Link
                to="/register"
                className="px-6 py-3 flat-button text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
              >
                重新注册
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
              >
                返回登录
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
