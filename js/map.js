/* ============================================
   地图模块 - Leaflet 地图封装
   ============================================ */

const MapModule = (() => {
  let map = null;
  let markers = [];
  let polylines = [];
  let currentFigureId = null;
  let clickHandler = null;
  let onMarkerClick = null;

  // 初始化地图
  function init(containerId) {
    map = L.map(containerId, {
      center: [35, 110],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
      minZoom: 4,
      maxZoom: 12,
      attributionControl: false
    });

    // 国内可用的瓦片源（高德地图）
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      attribution: '高德地图'
    }).addTo(map);

    map.on('click', (e) => {
      if (clickHandler) clickHandler(e.latlng);
    });

    // ResizeObserver：容器尺寸变化时自动刷新地图
    if (window.ResizeObserver) {
      var container = document.getElementById(containerId) || map.getContainer();
      if (container && container.parentElement) {
        var ro = new ResizeObserver(function () {
          if (map) setTimeout(function () { map.invalidateSize(); }, 50);
        });
        ro.observe(container.parentElement);
      }
    }

    return map;
  }

  // 设置地图点击处理
  function setMapClickHandler(handler) {
    clickHandler = handler;
  }

  // 设置标记点击回调
  function setMarkerClickHandler(handler) {
    onMarkerClick = handler;
  }

  // 清除所有标记和连线
  function clearLayers() {
    if (!map) return;
    markers.forEach(m => { try { map.removeLayer(m); } catch (e) {} });
    polylines.forEach(p => { try { map.removeLayer(p); } catch (e) {} });
    markers = [];
    polylines = [];
  }

  // 清除连线
  function clearPolylines() {
    if (!map) return;
    polylines.forEach(p => { try { map.removeLayer(p); } catch (e) {} });
    polylines = [];
  }

  // 添加籍贯标记
  function addOriginMarker(lat, lng, title, figureId, figureName) {
    if (!map) return null;
    var label = figureName ? figureName.charAt(0) : '籍';
    const icon = L.divIcon({
      className: 'custom-marker origin',
      html: label,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindTooltip(title, { direction: 'top', offset: [0, -18] });

    marker._type = 'origin';
    marker._figureId = figureId;
    markers.push(marker);
    return marker;
  }

  // 添加轨迹标记（带编号）
  function addTrajectoryMarker(lat, lng, label, title, figureId, pointIndex) {
    if (!map) return null;
    const icon = L.divIcon({
      className: 'custom-marker trajectory',
      html: label,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindTooltip(title, { direction: 'top', offset: [0, -16] });

    marker._type = 'trajectory';
    marker._figureId = figureId;
    marker._pointIndex = pointIndex;

    if (onMarkerClick) {
      marker.on('click', () => onMarkerClick(figureId, pointIndex));
    }

    markers.push(marker);
    return marker;
  }

  // 绘制轨迹连线（带箭头）
  function drawTrajectoryLine(points, origin) {
    clearPolylines();

    if (!points || points.length === 0) return;

    // 如果有籍贯，将其作为起点
    var allPoints = [];
    if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number' &&
        !isNaN(origin.lat) && !isNaN(origin.lng)) {
      allPoints.push({ lat: origin.lat, lng: origin.lng, events: [] });
    }

    var sorted = [...points].sort((a, b) => {
      const aMin = a.events && a.events.length > 0
        ? Math.min(...a.events.map(e => e.year || 0))
        : Infinity;
      const bMin = b.events && b.events.length > 0
        ? Math.min(...b.events.map(e => e.year || 0))
        : Infinity;
      return aMin - bMin;
    });

    allPoints = allPoints.concat(sorted);

    if (allPoints.length < 2) return;

    const latlngs = allPoints.map(p => [p.lat, p.lng]);

    // 主路线
    const polyline = L.polyline(latlngs, {
      color: '#5C4033',
      weight: 1.5,
      dashArray: '8, 6',
      opacity: 0.7,
      lineJoin: 'round'
    }).addTo(map);
    polylines.push(polyline);

    // 箭头标记（每隔一段加一个）
    for (let i = 0; i < latlngs.length - 1; i++) {
      const from = latlngs[i];
      const to = latlngs[i + 1];
      addArrowHead(from, to);
    }
  }

  // 添加箭头
  function addArrowHead(from, to) {
    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    const angle = Math.atan2(to[0] - from[0], to[1] - from[1]) * (180 / Math.PI);

    const arrowIcon = L.divIcon({
      className: 'arrow-head',
      html: `<div style="
        transform: rotate(${angle}deg);
        font-size: 14px;
        color: #5C4033;
        opacity: 0.6;
        line-height: 1;
      ">▶</div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const arrow = L.marker([midLat, midLng], {
      icon: arrowIcon,
      interactive: false
    }).addTo(map);
    polylines.push(arrow);
  }

  // 飞行到某个位置
  function flyTo(lat, lng, zoom = 8) {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }

  // 适配所有标记
  function fitAllMarkers() {
    if (markers.length === 0) {
      map.setView([35, 110], 5);
      return;
    }
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }

  // 重置视图
  function resetView() {
    map.setView([35, 110], 5);
  }

  // 获取地图实例
  function getMap() {
    return map;
  }

  // 设置当前人物
  function setCurrentFigure(figure) {
    currentFigureId = figure ? figure.id : null;
  }

  // 渲染人物轨迹
  function renderFigure(figure) {
    clearLayers();
    setCurrentFigure(figure);

    if (!figure) {
      console.log('renderFigure: figure为空，重置视图');
      resetView();
      return;
    }

    console.log('renderFigure: 开始渲染', figure.name, 'origin:', figure.origin);

    // 籍贯
    if (figure.origin) {
      if (typeof figure.origin.lat !== 'number' || typeof figure.origin.lng !== 'number' ||
          isNaN(figure.origin.lat) || isNaN(figure.origin.lng)) {
        console.warn('renderFigure: 籍贯坐标无效', figure.origin);
      } else {
        addOriginMarker(
          figure.origin.lat, figure.origin.lng,
          `${figure.name} - ${figure.origin.placeName} - 籍贯`,
          figure.id,
          figure.name
        );
      }
    } else {
      console.log('renderFigure: 无籍贯数据');
    }

    // 轨迹
    if (figure.trajectory && figure.trajectory.length > 0) {
      // 按时间排序
      const sorted = [...figure.trajectory].sort((a, b) => {
        const aMin = a.events && a.events.length > 0
          ? Math.min(...a.events.map(e => e.year || 0))
          : Infinity;
        const bMin = b.events && b.events.length > 0
          ? Math.min(...b.events.map(e => e.year || 0))
          : Infinity;
        return aMin - bMin;
      });

      sorted.forEach((point, idx) => {
        const label = String(idx + 1);
        const eventNames = point.events
          ? point.events.map(e => e.title).join('; ')
          : '';
        const tooltip = `${figure.name} - ${point.placeName} - ${eventNames || '途经'}`;
        addTrajectoryMarker(point.lat, point.lng, label, tooltip, figure.id, idx);
      });

      drawTrajectoryLine(figure.trajectory, figure.origin);
    }

    if (markers.length > 0) {
      fitAllMarkers();
    }
  }

  return {
    init,
    setMapClickHandler,
    setMarkerClickHandler,
    clearLayers,
    addOriginMarker,
    addTrajectoryMarker,
    drawTrajectoryLine,
    flyTo,
    fitAllMarkers,
    resetView,
    renderFigure,
    getMap
  };
})();
