/* ============================================
   应用主逻辑
   ============================================ */

(function () {
  'use strict';

  // 等待 DOM 和所有模块加载完成
  document.addEventListener('DOMContentLoaded', function () {
    try {
      // 初始化数据层
      const { figures, locations } = DataManager.init();
      console.log('DataManager 初始化完成, 人物:', figures.length, '地点:', Object.keys(locations).length);

      // 初始化 UI
      UIModule.init();
      console.log('UIModule 初始化完成');

      // 初始化地图
      let map;
      try {
        map = MapModule.init('map');
        console.log('地图初始化完成, map:', map);
        // 延迟刷新地图尺寸（解决容器尺寸未完全确定的常见问题）
        setTimeout(function () {
          if (map) {
            map.invalidateSize();
            console.log('invalidateSize 已执行');
          }
        }, 200);
      } catch (e) {
        console.error('地图初始化失败:', e.message, e.stack);
      }

      // 设置地图标记点击回调
      MapModule.setMarkerClickHandler((figureId, pointIndex) => {
        const figure = DataManager.getFigure(figureId);
        if (!figure || !figure.trajectory || !figure.trajectory[pointIndex]) return;
        const point = figure.trajectory[pointIndex];
        showPointPopup(figure, point, pointIndex);
      });

      // 设置 UI 回调
      UIModule.setCallbacks({
        onFigureChange: handleFigureChange,
        onFlyTo: handleFlyTo
      });

      // 全局点击处理（inline onclick 后备）
      window._addFigureClick = function () {
        console.log('_addFigureClick 被调用');
        UIModule.showAddForm();
      };

      // 保存按钮 inline onclick 后备
      window._saveFigureClick = function (e) {
        if (!e) e = window.event;
        if (e) e.preventDefault();
        console.log('_saveFigureClick 被调用');
        var form = document.getElementById('figureForm');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      };

      // 初始化人物下拉
      refreshSelect();

      // 自动保存定时器（每30秒）
      setInterval(function () {
        DataManager.saveFigures();
      }, 30000);

      // ============================================
      // 人物切换处理
      // ============================================
      function handleFigureChange(figureId) {
        if (!figureId) {
          MapModule.renderFigure(null);
          UIModule.updateSidePanel(null);
          UIModule.refreshFigureSelect(DataManager.getFigures(), null);
          return;
        }

        const figure = DataManager.getFigure(figureId);
        if (!figure) {
          MapModule.renderFigure(null);
          UIModule.updateSidePanel(null);
          UIModule.refreshFigureSelect(DataManager.getFigures(), null);
          return;
        }

        MapModule.renderFigure(figure);
        UIModule.refreshFigureSelect(DataManager.getFigures(), figureId);
        UIModule.updateSidePanel(figure);
      }

      // ============================================
      // 飞到某位置
      // ============================================
      function handleFlyTo(lat, lng) {
        MapModule.flyTo(lat, lng);
      }

      // ============================================
      // 显示地点弹窗
      // ============================================
      function showPointPopup(figure, point, pointIndex) {
        var eventsList = point.events && point.events.length > 0
          ? point.events.map(function (e) {
              return '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px dotted #E0D5C5;">' +
                '<strong>' + e.year + '</strong> ' +
                '<span class="type-tag type-' + e.type + '">' + e.type + '</span> ' +
                '<span>' + e.title + '</span>' +
                (e.detail ? '<div style="font-size:0.8rem;color:#6B5B4F;margin-top:2px;">' + e.detail + '</div>' : '') +
                (e.works && e.works.length > 0 ? '<div style="font-size:0.78rem;color:#2F4F4F;">📖 ' + e.works.join('、') + '</div>' : '') +
                '</div>';
            }).join('')
          : '<div style="color:#8C7A6A;">暂无事件记录</div>';

        var content = '<div style="font-family:Georgia,\'宋体\',\'Songti SC\',\'SimSun\',serif;">' +
          '<div style="font-weight:700;font-size:1rem;color:#5C4033;margin-bottom:4px;">' +
          point.province + ' · ' + point.placeName +
          '</div>' +
          '<div style="font-size:0.78rem;color:#8C7A6A;margin-bottom:8px;">' +
          figure.name + ' · 第' + (pointIndex + 1) + '站' +
          '</div>' +
          eventsList +
          '</div>';

        if (map) {
          var popup = L.popup({
            maxWidth: 320,
            className: 'historical-popup',
            offset: [0, -14]
          })
            .setLatLng([point.lat, point.lng])
            .setContent(content);
          popup.openOn(map);
        }
      }

      // ============================================
      // 刷新下拉框
      // ============================================
      function refreshSelect(selectedId) {
        UIModule.refreshFigureSelect(DataManager.getFigures(), selectedId);
      }

      // ============================================
      // 首次使用引导
      // ============================================
      if (figures.length === 0) {
        document.getElementById('guideOverlay').classList.add('show');
      }

      console.log('历史人物地理志 v1.0 已加载');
      console.log('已加载 ' + figures.length + ' 个人物，' + Object.keys(locations).length + ' 个地点');

      // 监听 Gist 云端数据同步事件，自动刷新界面
      window.addEventListener('figures-gist-synced', function () {
        console.log('Gist 数据已同步，刷新界面');
        handleFigureChange(DataManager.getCurrentFigure() ? DataManager.getCurrentFigure().id : null);
      });
    } catch (e) {
      console.error('应用初始化失败:', e);
      // 在页面上显示错误
      var errDiv = document.createElement('div');
      errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#8B0000;color:#F5F0E8;padding:20px;z-index:9999;font-family:monospace;';
      errDiv.textContent = '初始化错误: ' + (e.message || e);
      document.body.appendChild(errDiv);
    }
  });
})();
