import { X, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useRef, ChangeEvent } from 'react';
import { useStore } from '../store';
import { Course } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 常见教务系统的课表选择器配置
const SYSTEM_CONFIGS = {
  default: {
    name: '通用教务系统',
    selectors: [
      'table#manualArrangeCourseTable', // 首师大等系统
      'table.infolist_tab',
      'table.infolist_common',
      'table#kbtable',
      'table.kbcontent',
      'table[id*="Table"]',
      'table.grid',
      'table.gridtable',
    ]
  }
};

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { addCourse, clearAllCourses, mySchedule } = useStore();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'input' | 'iframe' | 'manual' | 'confirm' | 'success'>('select');
  const [error, setError] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [manualHtml, setManualHtml] = useState('');
  const [pendingCourses, setPendingCourses] = useState<Omit<Course, 'id'>[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const handleStartImport = () => {
    if (!url) {
      setError('请输入教务系统网址');
      return;
    }
    setError('');
    setStep('iframe');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          
          if (!content) {
            throw new Error('文件读取失败');
          }

          // 将文件内容设置到textarea中
          setManualHtml(content);
          
          // 自动解析
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          
          const courses = parseScheduleFromHTML(doc);
          
          if (courses.length === 0) {
            throw new Error('未找到课表数据，请确保上传的是正确的课表文件');
          }

          // 保存待导入的课程，显示确认对话框
          setPendingCourses(courses);
          setStep('confirm');
        } catch (err) {
          setError(err instanceof Error ? err.message : '文件解析失败，请重试');
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError('文件读取失败');
        setIsLoading(false);
      };

      // 读取文件内容
      reader.readAsText(file, 'GBK');
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件上传失败，请重试');
      setIsLoading(false);
    }
  };

  const handleManualImport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!manualHtml.trim()) {
        throw new Error('请粘贴课表HTML代码');
      }

      // 创建临时DOM来解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(manualHtml, 'text/html');
      
      const courses = parseScheduleFromHTML(doc);
      
      if (courses.length === 0) {
        throw new Error('未找到课表数据，请确保粘贴的是完整的课表HTML代码');
      }

      // 保存待导入的课程，显示确认对话框
      setPendingCourses(courses);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const iframe = iframeRef.current;
      if (!iframe) {
        throw new Error('无法访问页面');
      }

      let doc: Document | null = null;
      
      // 尝试访问 iframe 内容
      try {
        doc = iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch (e) {
        throw new Error('无法访问页面内容，这可能是由于跨域限制。\n请点击"手动导入"按钮使用备用方案。');
      }

      if (!doc) {
        throw new Error('无法访问页面内容，请确保已登录并进入课表页面');
      }

      const courses = parseScheduleFromHTML(doc);
      
      if (courses.length === 0) {
        throw new Error('未找到课表数据，请确保已进入课表页面');
      }

      // 保存待导入的课程，显示确认对话框
      setPendingCourses(courses);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const parseScheduleFromHTML = (doc: Document): Omit<Course, 'id'>[] => {
    const courses: Omit<Course, 'id'>[] = [];
    
    // 尝试不同的选择器找到课表
    let table: HTMLTableElement | null = null;
    for (const selector of SYSTEM_CONFIGS.default.selectors) {
      table = doc.querySelector(selector);
      if (table) break;
    }

    if (!table) {
      throw new Error('未找到课表，请确保已进入课表页面');
    }

    // 提取时间信息
    const periodTimes: string[] = [];
    const timeRows = table.querySelectorAll('tbody tr');
    timeRows.forEach((row) => {
      const timeCell = row.querySelector('td:first-child');
      if (timeCell) {
        const timeText = timeCell.textContent?.trim() || '';
        // 匹配时间格式，如 "8:00- 8:40" 或 "8:00-8:40"
        const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const startTime = timeMatch[1];
          periodTimes.push(startTime);
        }
      }
    });

    // 如果成功提取到时间信息，更新设置
    if (periodTimes.length > 0) {
      const { updateSettings } = useStore.getState();
      updateSettings({
        periodTimes: periodTimes,
        totalPeriods: periodTimes.length,
      });
    }

    // 尝试从script标签中提取周数信息
    const weekDataMap = new Map<string, string>(); // key: 课程名|地点, value: 01字符串
    const scripts = doc.querySelectorAll('script');
    
    scripts.forEach((script) => {
      const scriptText = script.textContent || '';
      
      if (scriptText.length > 0) {
        // 使用正则表达式匹配 TaskActivity 构造函数
        // 匹配格式：activity = new TaskActivity(...);
        const activityPattern = /activity\s*=\s*new\s+TaskActivity\s*\(([\s\S]*?)\);/g;
        let match;
        
        while ((match = activityPattern.exec(scriptText)) !== null) {
          const params = match[1];
          
          // 提取所有引号中的字符串参数
          // 注意：参数中可能包含 actTeacherId.join(',') 这样的表达式
          const stringParams: string[] = [];
          
          let inString = false;
          let currentString = '';
          
          for (let i = 0; i < params.length; i++) {
            const char = params[i];
            
            if (char === '"' && (i === 0 || params[i-1] !== '\\')) {
              if (!inString) {
                inString = true;
                currentString = '';
              } else {
                inString = false;
                stringParams.push(currentString);
                currentString = '';
              }
            } else if (inString) {
              currentString += char;
            }
          }
          
          // TaskActivity 字符串参数顺序：
          // 0: 课程ID，如 "24228(3107088.01)"
          // 1: 课程名，如 "机器学习(3107088.01)"
          // 2: 地点ID，如 "474"
          // 3: 地点名，如 "北二区 北二教学楼 228j（公共阶梯）"
          // 4: 01字符串，如 "01111111111111111000000000000000000000000000000000000"
          
          if (stringParams.length >= 5) {
            const courseName = stringParams[1]; // 课程名（包含课程号）
            const location = stringParams[3]; // 地点
            const weekString = stringParams[4]; // 01字符串
            
            // 验证weekString是否是01字符串（至少10个字符，只包含0和1）
            if (weekString.length >= 10 && /^[01]+$/.test(weekString)) {
              // 提取纯课程名（去掉课程号）
              const pureNameMatch = courseName.match(/^([^(]+)\(/);
              const pureName = pureNameMatch ? pureNameMatch[1].trim() : courseName;
              
              const key = `${pureName}|${location}`;
              weekDataMap.set(key, weekString);
            }
          }
        }
      }
    });

    // 解析课表 - 使用单元格ID来确定位置
    const allCells = table.querySelectorAll('tbody td[id^="TD"]');
    
    allCells.forEach((cell) => {
      const cellId = cell.id;
      if (!cellId || !cellId.startsWith('TD')) return;
      
      // 解析单元格ID，格式为 TD{index}_{0}
      // index = (period - 1) + (day - 1) * totalPeriods
      // 例如：TD0_0 是周一第1节，TD13_0 是周二第1节（假设有13个节次）
      const match = cellId.match(/TD(\d+)_(\d+)/);
      if (!match) return;
      
      const index = parseInt(match[1]);
      
      // 从提取的时间信息中获取总节次数，如果没有则使用默认值13
      const totalPeriods = periodTimes.length > 0 ? periodTimes.length : 13;
      
      // 根据index计算星期几和节次
      // dayOfWeek = floor(index / totalPeriods) + 1
      // period = (index % totalPeriods) + 1
      const dayOfWeek = Math.floor(index / totalPeriods) + 1;
      const startPeriod = (index % totalPeriods) + 1;
      
      // 获取单元格内容
      const title = cell.getAttribute('title') || '';
      const html = cell.innerHTML || '';
      const text = cell.textContent?.trim() || '';
      
      // 跳过空单元格
      const htmlCell = cell as HTMLElement;
      if (!text || text.length < 2 || htmlCell.style.backgroundColor === 'rgb(255, 255, 255)' || htmlCell.style.backgroundColor === '#ffffff') {
        return;
      }
      
      // 检查rowspan属性，确定课程跨越的节次
      const rowspan = cell.getAttribute('rowspan');
      const spanCount = rowspan ? parseInt(rowspan) : 1;
      const endPeriod = startPeriod + spanCount - 1;
      
      // 解析课程信息（优先使用title属性，因为它包含完整信息）
      const courseInfos = parseCourseInfo(title || text, html);
      
      courseInfos.forEach(courseInfo => {
        if (courseInfo) {
          // 尝试从weekDataMap中获取周数信息
          const key = `${courseInfo.name}|${courseInfo.location}`;
          const weekString = weekDataMap.get(key);
          
          let weekType: 'all' | 'odd' | 'even' | 'custom' = 'all';
          let customWeeks: number[] = [];
          
          if (weekString) {
            // 从01字符串解析周数
            // 注意：第一位（索引0）是第0周，应该忽略
            // 从第二位（索引1）开始才是第1周
            customWeeks = [];
            for (let i = 1; i < weekString.length; i++) {
              if (weekString[i] === '1') {
                customWeeks.push(i); // 索引1对应第1周，索引2对应第2周，以此类推
              }
            }
            weekType = customWeeks.length > 0 ? 'custom' : 'all';
          }
          
          courses.push({
            ...courseInfo,
            dayOfWeek: dayOfWeek,
            startPeriod: startPeriod,
            endPeriod: endPeriod,
            color: getRandomColor(),
            weekType: weekType,
            customWeeks: customWeeks
          });
        }
      });
    });

    return courses;
  };

  const parseCourseInfo = (text: string, html: string): Array<{ 
    name: string; 
    location: string; 
    teacher: string;
  }> => {
    const results: Array<{ 
      name: string; 
      location: string; 
      teacher: string;
    }> = [];
    
    // 处理HTML中的<br>标签
    const normalizedText = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    // 检查是否是title属性（包含;;;分隔符）
    const isTitleFormat = text.includes(';;;') || text.includes(';(');
    
    if (isTitleFormat) {
      // title属性格式：课程名(课程号) (教师);;;(周数,地点)
      // 或：课程名(课程号) (教师);(周数1,地点1);课程名(课程号) (教师);(周数2,地点2)
      
      // 先按;;;分割，如果没有则按;分割
      let parts: string[];
      if (text.includes(';;;')) {
        parts = text.split(';;;');
      } else {
        // 按;分割，但要处理课程名中可能包含的括号
        parts = text.split(/;(?=[^)]*\()/);
      }
      
      // 第一部分是课程名和教师
      const firstPart = parts[0].trim();
      let baseName = '';
      let baseTeacher = '';
      
      // 提取课程名称（去掉课程号）
      const courseNameMatch = firstPart.match(/^([^(]+)\([^)]+\)/);
      if (courseNameMatch) {
        baseName = courseNameMatch[1].trim();
      } else {
        baseName = firstPart.split('(')[0].trim();
      }
      
      // 提取教师名称（最后一个括号中的内容）
      const teacherMatch = firstPart.match(/\(([^)]+)\)$/);
      if (teacherMatch) {
        baseTeacher = teacherMatch[1].trim();
      }
      
      // 处理后续部分（周数和地点）
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        
        // 检查是否是新的课程（包含课程名）
        let name = baseName;
        let teacher = baseTeacher;
        let location = '';
        
        // 如果这部分包含课程名，说明是新的课程条目
        const newCourseMatch = part.match(/^([^(]+)\([^)]+\)\s*\(([^)]+)\)/);
        if (newCourseMatch) {
          name = newCourseMatch[1].trim();
          teacher = newCourseMatch[2].trim();
          // 继续处理这部分的剩余内容
        }
        
        // 提取地点：(周数,地点)
        const locationMatch = part.match(/\(([^,]+),(.+)\)/);
        if (locationMatch) {
          location = locationMatch[2].trim();
        }
        
        if (name) {
          results.push({
            name,
            teacher,
            location
          });
        }
      }
    } else {
      // 普通格式：按换行分割
      const courseBlocks = normalizedText.split(/\n{2,}(?=[^\n])/);
      
      courseBlocks.forEach(block => {
        const lines = block.split(/[\n\r]+/).map(l => l.trim()).filter(l => l && l.length > 0);
        
        if (lines.length === 0) return;
        
        let name = '';
        let teacher = '';
        let location = '';
        
        // 第一行通常是：课程名称(课程号) (教师名)
        const firstLine = lines[0];
        
        // 提取课程名称（去掉课程号）
        const courseNameMatch = firstLine.match(/^([^(]+)\([^)]+\)/);
        if (courseNameMatch) {
          name = courseNameMatch[1].trim();
        } else {
          name = firstLine.split('(')[0].trim();
        }
        
        // 提取教师名称（括号中的内容）
        const teacherMatch = firstLine.match(/\(([^)]+)\)$/);
        if (teacherMatch) {
          teacher = teacherMatch[1].trim();
        }
        
        // 解析其他信息
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          
          // 提取地点：(周数,地点)
          const locationMatch = line.match(/\(([^,]+),(.+)\)/);
          if (locationMatch) {
            location = locationMatch[2].trim();
            continue;
          }
          
          // 检测地点（包含"楼"、"室"、"教"等关键字）
          if (!location && (line.includes('楼') || line.includes('室') || line.includes('教') || line.includes('区'))) {
            location = line;
            continue;
          }
          
          // 检测教师（如果第一行没有提取到）
          if (!teacher && (line.includes('老师') || line.includes('教师') || /^[\u4e00-\u9fa5]{2,4}$/.test(line))) {
            teacher = line.replace(/老师|教师/g, '').trim();
            continue;
          }
        }
        
        // 如果没有提取到名称，使用第一行
        if (!name) {
          name = lines[0] || '未命名课程';
        }
        
        results.push({
          name: name || '未命名课程',
          teacher,
          location
        });
      });
    }
    
    return results;
  };

  const getRandomColor = () => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleClose = () => {
    setStep('select');
    setUrl('');
    setError('');
    setImportedCount(0);
    setManualHtml('');
    setPendingCourses([]);
    onClose();
  };

  const confirmImport = () => {
    // 清空原有课表
    clearAllCourses();
    
    // 导入新课表
    pendingCourses.forEach(course => addCourse(course));
    setImportedCount(pendingCourses.length);
    setPendingCourses([]);
    setStep('success');
  };

  const cancelImport = () => {
    setPendingCourses([]);
    setStep('select');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="flat-modal rounded-2xl w-full h-full max-w-6xl max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">一键导入课表</h2>
          <button onClick={handleClose} className="flat-button p-2 rounded-xl">
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {step === 'select' && (
          <div className="p-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
              请选择导入方式
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                disabled
                className="flat-card p-6 rounded-2xl transition-all text-left group opacity-50 cursor-not-allowed relative"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <Download className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                      网页导入
                      <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                        开发中
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      通过内嵌网页登录教务系统并同步课表
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('manual')}
                className="flat-card p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left group"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">文件导入</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      上传教务系统导出的XLS文件或粘贴HTML代码
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">💡 推荐方式</h3>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>推荐使用"文件导入"，支持大多数教务系统</li>
                <li>网页导入功能正在开发中，敬请期待</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {step === 'input' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2">教务系统网址</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="例如：https://jwxt.example.edu.cn"
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">使用说明</h3>
              <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>输入你的教务系统网址</li>
                <li>在打开的页面中登录教务系统</li>
                <li>如需扫码登录，建议点击"在新窗口打开"</li>
                <li>导航到课表页面</li>
                <li>点击"同步课表"或使用"手动导入"</li>
              </ol>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                注意事项
              </h3>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>支持大多数常见教务系统</li>
                <li>如遇跨域限制，可使用"手动导入"功能</li>
                <li>导入后请检查课程信息是否正确</li>
                <li>可能需要手动调整节次和周数</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setStep('select')}
                className="flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
              >
                返回
              </button>
              <button
                onClick={handleStartImport}
                className="px-6 py-3 font-semibold rounded-xl text-white shadow-md transition-all bg-blue-500 hover:bg-blue-600"
              >
                开始导入
              </button>
            </div>
          </div>
        )}

        {step === 'iframe' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  请在下方页面中登录并进入课表页面，然后点击"同步课表"
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 font-semibold rounded-xl text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
                    title="在新窗口打开，方便扫码登录"
                  >
                    在新窗口打开
                  </button>
                  <button
                    onClick={() => setStep('manual')}
                    className="flex items-center gap-2 px-4 py-2 font-semibold rounded-xl text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                  >
                    手动导入
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 font-semibold rounded-xl text-white shadow-md transition-all disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600 shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        同步课表
                      </>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-line">{error}</span>
                </div>
              )}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  💡 提示：如果扫码登录后页面没有跳转，请点击"在新窗口打开"按钮，在新窗口中完成登录和导航，然后使用"手动导入"功能。
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-white overflow-hidden">
              <iframe
                ref={iframeRef}
                src={url}
                className="w-full h-full border-0"
                title="教务系统"
                allow="fullscreen; camera; microphone"
              />
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div className="p-6 space-y-4 flex flex-col flex-1 min-h-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">手动导入说明</h3>
              <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li><strong>方法一：</strong>在教务系统中导出课表为XLS文件，然后上传该文件</li>
                <li><strong>方法二：</strong>在教务系统中打开课表页面，按 F12 打开开发者工具</li>
                <li>在 Elements/元素 标签页中找到课表的 table 元素</li>
                <li>右键点击 table 元素，选择"Copy" → "Copy outerHTML"</li>
                <li>将复制的内容粘贴到下方文本框中</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <label className="flex-1">
                <div className="flat-button px-4 py-3 rounded-xl text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                  <input
                    type="file"
                    accept=".xls,.html,.htm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    📁 选择XLS/HTML文件
                  </span>
                </div>
              </label>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2">或粘贴课表HTML代码</label>
              <textarea
                value={manualHtml}
                onChange={(e) => setManualHtml(e.target.value)}
                placeholder="粘贴课表的HTML代码或XLS文件内容..."
                className="flat-input flex-1 min-h-0 px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono text-xs resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={() => setStep('select')}
                className="flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
              >
                返回
              </button>
              <button
                onClick={handleManualImport}
                disabled={isLoading || !manualHtml.trim()}
                className="px-6 py-3 font-semibold rounded-xl text-white shadow-md transition-all disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    导入中...
                  </>
                ) : (
                  '开始导入'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">确认导入课表</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    检测到 <span className="font-bold text-amber-600 dark:text-amber-400">{pendingCourses.length}</span> 门课程待导入
                  </p>
                  {mySchedule.courses.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        ⚠️ 您当前有 <span className="font-bold">{mySchedule.courses.length}</span> 门课程
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        导入新课表将清空所有现有课程，此操作不可撤销！
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">即将导入的课程预览</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {pendingCourses.slice(0, 10).map((course, index) => (
                  <div key={index} className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 rounded p-2 border border-blue-200 dark:border-blue-700">
                    <span className="font-bold">{course.name}</span>
                    {course.teacher && <span className="ml-2 text-gray-500 dark:text-gray-400">- {course.teacher}</span>}
                    {course.location && <span className="ml-2 text-gray-500 dark:text-gray-400">@ {course.location}</span>}
                  </div>
                ))}
                {pendingCourses.length > 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    还有 {pendingCourses.length - 10} 门课程...
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={cancelImport}
                className="flex-1 flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 px-6 py-3 font-semibold rounded-xl text-white shadow-md transition-all bg-amber-500 hover:bg-amber-600"
              >
                确认导入并覆盖
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">导入成功！</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              已成功导入 {importedCount} 门课程
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 font-semibold rounded-xl text-white shadow-md transition-all bg-emerald-500 hover:bg-emerald-600"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
