/* ============================================
   数据管理器 - LocalStorage 读写 + JSON导入导出
   ============================================ */

const DataManager = (() => {
  const STORAGE_KEY = 'historical_figures_data';
  let figures = [];
  let locations = {};

  // 初始化
  function init() {
    loadLocations();
    loadFigures();
    return { figures, locations };
  }

  // 加载locations数据（从全局变量同步读取，兼容file://协议）
  function loadLocations() {
    if (typeof window !== 'undefined' && window.LOCATIONS_DATA) {
      locations = window.LOCATIONS_DATA;
    } else {
      console.warn('LOCATIONS_DATA 未加载，使用内置基础数据');
      locations = getFallbackLocations();
    }
  }

  function getFallbackLocations() {
    return {
      "北京_北京市": { lat: 39.90, lng: 116.40, province: "北京", county: "北京市" },
      "上海_上海市": { lat: 31.23, lng: 121.47, province: "上海", county: "上海市" },
      "湖南_长沙县": { lat: 28.23, lng: 112.98, province: "湖南", county: "长沙县" },
      "湖南_湘乡县": { lat: 27.73, lng: 112.18, province: "湖南", county: "湘乡县" },
      "直隶_大兴县": { lat: 39.90, lng: 116.40, province: "直隶", county: "大兴县" }
    };
  }

  // 从 LocalStorage 加载人物
  function loadFigures() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        figures = JSON.parse(stored);
        return;
      }
    } catch (e) {
      console.warn('LocalStorage 读取失败', e);
    }
    figures = [];
  }

  // 保存到 LocalStorage
  function saveFigures() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(figures));
    } catch (e) {
      console.error('LocalStorage 写入失败', e);
    }
  }

  // 获取所有人物
  function getFigures() {
    return figures;
  }

  // 获取单个人物
  function getFigure(id) {
    return figures.find(f => f.id === id) || null;
  }

  // 生成人物ID
  function generateId(name) {
    return name.replace(/\s+/g, '_')
      .replace(/[^\w一-鿿]/g, '')
      .toLowerCase() + '_' + Date.now().toString(36);
  }

  let currentFigureId = null;

  function setCurrentFigureId(id) {
    currentFigureId = id;
  }

  function getCurrentFigure() {
    return currentFigureId ? getFigure(currentFigureId) : null;
  }

  // 添加人物
  function addFigure(figure) {
    if (!figure.id) {
      figure.id = generateId(figure.name);
    }
    figures.push(figure);
    currentFigureId = figure.id;
    saveFigures();
    return figure;
  }

  // 更新人物
  function updateFigure(id, updates) {
    const idx = figures.findIndex(f => f.id === id);
    if (idx === -1) return null;
    figures[idx] = { ...figures[idx], ...updates };
    currentFigureId = id;
    saveFigures();
    return figures[idx];
  }

  // 删除人物
  function deleteFigure(id) {
    figures = figures.filter(f => f.id !== id);
    saveFigures();
  }

  // 添加轨迹地点
  function addTrajectoryPoint(figureId, point) {
    const fig = getFigure(figureId);
    if (!fig) return null;
    if (!fig.trajectory) fig.trajectory = [];
    fig.trajectory.push(point);
    saveFigures();
    return fig;
  }

  // 删除轨迹地点
  function removeTrajectoryPoint(figureId, pointIndex) {
    const fig = getFigure(figureId);
    if (!fig || !fig.trajectory) return null;
    fig.trajectory.splice(pointIndex, 1);
    saveFigures();
    return fig;
  }

  // 添加事件到地点
  function addEvent(figureId, pointIndex, event) {
    const fig = getFigure(figureId);
    if (!fig || !fig.trajectory || !fig.trajectory[pointIndex]) return null;
    if (!fig.trajectory[pointIndex].events) {
      fig.trajectory[pointIndex].events = [];
    }
    fig.trajectory[pointIndex].events.push(event);
    updateWorksIndex(fig);
    saveFigures();
    return fig;
  }

  // 更新著作索引
  function updateWorksIndex(fig) {
    fig.worksIndex = [];
    if (!fig.trajectory) return;
    fig.trajectory.forEach(point => {
      if (!point.events) return;
      point.events.forEach(evt => {
        if (evt.works && evt.works.length > 0) {
          evt.works.forEach(w => {
            fig.worksIndex.push({
              title: w,
              year: evt.year,
              placeName: point.placeName,
              county: point.county,
              province: point.province,
              type: evt.type
            });
          });
        }
      });
    });
  }

  // 获取所有事件（排序）
  function getAllEvents(figureId) {
    const fig = getFigure(figureId);
    if (!fig || !fig.trajectory) return [];
    const events = [];
    fig.trajectory.forEach(point => {
      if (!point.events) return;
      point.events.forEach(evt => {
        events.push({
          ...evt,
          placeName: point.placeName,
          province: point.province,
          county: point.county,
          lat: point.lat,
          lng: point.lng
        });
      });
    });
    events.sort((a, b) => (a.year || 0) - (b.year || 0));
    return events;
  }

  // 从地点路径重建著作索引
  function rebuildWorksIndex(fig) {
    fig.worksIndex = [];
    const seen = new Set();
    if (!fig.trajectory) return;
    fig.trajectory.forEach(point => {
      if (!point.events) return;
      point.events.forEach(evt => {
        if (evt.works && Array.isArray(evt.works)) {
          evt.works.forEach(w => {
            if (!seen.has(w)) {
              seen.add(w);
              fig.worksIndex.push({
                title: w,
                year: evt.year,
                placeName: point.placeName,
                county: point.county,
                province: point.province,
                type: evt.type
              });
            }
          });
        }
      });
    });
    saveFigures();
  }

  // 获取 locations
  function getLocations() {
    return locations;
  }

  // 搜索地点
  function searchLocations(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const results = [];
    for (const [key, val] of Object.entries(locations)) {
      if (key.includes(q) || val.county.includes(q) || val.province.includes(q)) {
        results.push({ key, ...val });
      }
    }
    return results.slice(0, 20);
  }

  // 获取所有省份列表（用于下拉）
  function getProvinces() {
    const set = new Set();
    for (const val of Object.values(locations)) {
      set.add(val.province);
    }
    return Array.from(set).sort();
  }

  // 获取某省下的县
  function getCountiesByProvince(province) {
    const list = [];
    for (const val of Object.values(locations)) {
      if (val.province === province) {
        list.push(val);
      }
    }
    return list;
  }

  // 导出数据
  function exportData() {
    return {
      figures: figures
    };
  }

  // 导入数据（合并或覆盖）
  function importData(data, mode = 'merge') {
    if (!data || !data.figures) return false;
    if (mode === 'overwrite') {
      figures = data.figures;
    } else {
      // merge: 按id去重
      const existingIds = new Set(figures.map(f => f.id));
      for (const f of data.figures) {
        if (!existingIds.has(f.id)) {
          figures.push(f);
          existingIds.add(f.id);
        }
      }
    }
    saveFigures();
    return true;
  }

  // 下载JSON文件
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 上传JSON文件
  function uploadJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (err) {
          reject(new Error('JSON 解析失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  return {
    init,
    getFigures,
    getFigure,
    addFigure,
    updateFigure,
    deleteFigure,
    addTrajectoryPoint,
    removeTrajectoryPoint,
    addEvent,
    getAllEvents,
    rebuildWorksIndex,
    getLocations,
    searchLocations,
    getProvinces,
    getCountiesByProvince,
    exportData,
    importData,
    downloadJSON,
    uploadJSON,
    saveFigures,
    generateId,
    setCurrentFigureId,
    getCurrentFigure
  };
})();
