/* ============================================
   界面交互模块
   ============================================ */

const UIModule = (() => {
  let currentFigure = null;
  let onFigureChange = null;
  let onAddFigure = null;
  let onDeleteFigure = null;
  let onAddLocation = null;
  let onAddEvent = null;
  let onDeleteLocation = null;
  let onDeleteEvent = null;
  let onFlyTo = null;
  let editingMode = false;
  let selectedLocationLatLng = null;

  // 朝代多选状态
  var selectedDynasties = [];
  var DYNASTY_OPTIONS = ['清', '民国', '中华人民共和国'];

  // DOM 引用
  let els = {};

  function init() {
    try {
      cacheElements();
      bindEvents();
      populateProvinceOptions();
      initDynastyTags();
      console.log('UIModule.init() 完成');
    } catch (e) {
      console.error('UIModule.init() 失败:', e);
    }
  }

  function populateProvinceOptions() {
    const provinces = DataManager.getProvinces();
    els.formOriginProvince.innerHTML = '<option value="">— 选择省 —</option>';
    provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      els.formOriginProvince.appendChild(opt);
    });
  }

  // ============================================
  // 朝代多选标签
  // ============================================
  function initDynastyTags() {
    var container = document.getElementById('dynastyTagContainer');
    if (!container) return;
    container.innerHTML = '';
    DYNASTY_OPTIONS.forEach(function (d) {
      var tag = document.createElement('span');
      tag.className = 'tag-btn';
      tag.textContent = d;
      tag.dataset.dynasty = d;
      tag.addEventListener('click', function () { toggleDynasty(d); });
      container.appendChild(tag);
    });

    var addBtn = document.getElementById('dynastyCustomAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', addCustomDynasty);
    }
    var input = document.getElementById('formDynastyCustom');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addCustomDynasty(); }
      });
    }
  }

  function toggleDynasty(d) {
    var idx = selectedDynasties.indexOf(d);
    if (idx >= 0) { selectedDynasties.splice(idx, 1); }
    else { selectedDynasties.push(d); }
    updateDynastyUI();
  }

  function addCustomDynasty() {
    var input = document.getElementById('formDynastyCustom');
    if (!input) return;
    var val = input.value.trim();
    if (!val) return;
    if (selectedDynasties.indexOf(val) >= 0) {
      showToast('"' + val + '" 已存在');
      input.value = '';
      return;
    }
    selectedDynasties.push(val);
    input.value = '';
    updateDynastyUI();
  }

  function removeDynasty(d) {
    var idx = selectedDynasties.indexOf(d);
    if (idx >= 0) { selectedDynasties.splice(idx, 1); updateDynastyUI(); }
  }

  function getSelectedDynasties() {
    return selectedDynasties.slice();
  }

  function formatDynasty(dyn) {
    if (!dyn) return '?';
    return Array.isArray(dyn) ? dyn.join('·') : dyn;
  }

  function updateDynastyUI() {
    var btns = document.querySelectorAll('#dynastyTagContainer .tag-btn');
    btns.forEach(function (btn) {
      btn.classList.toggle('active', selectedDynasties.indexOf(btn.dataset.dynasty) >= 0);
    });
    var selectedDiv = document.getElementById('dynastySelectedTags');
    if (!selectedDiv) return;
    if (selectedDynasties.length === 0) {
      selectedDiv.innerHTML = '';
    } else {
      selectedDiv.innerHTML = selectedDynasties.map(function (d) {
        return '<span class="selected-tag">' + d +
          '<span class="tag-remove" data-dynasty="' + d + '">×</span></span>';
      }).join('');
      selectedDiv.querySelectorAll('.tag-remove').forEach(function (el) {
        el.addEventListener('click', function () { removeDynasty(el.dataset.dynasty); });
      });
    }
  }

  function cacheElements() {
    els = {
      figureSelect: document.getElementById('figureSelect'),
      addFigureBtn: document.getElementById('addFigureBtn'),
      dataExportBtn: document.getElementById('dataExportBtn'),
      dataImportBtn: document.getElementById('dataImportBtn'),
      dataImportFile: document.getElementById('dataImportFile'),
      sidePanel: document.getElementById('sidePanel'),
      guideOverlay: document.getElementById('guideOverlay'),
      tabTimeline: document.getElementById('tabTimeline'),
      tabWorks: document.getElementById('tabWorks'),
      tabTimelineBtn: document.getElementById('tabTimelineBtn'),
      tabWorksBtn: document.getElementById('tabWorksBtn'),
      timelineContent: document.getElementById('timelineContent'),
      worksContent: document.getElementById('worksContent'),
      editPanel: document.getElementById('editPanel'),
      editPanelBody: document.getElementById('editPanelBody'),
      editPanelClose: document.getElementById('editPanelClose'),
      figureInfoDisplay: document.getElementById('figureInfoDisplay'),
      // 编辑模式按钮
      addLocationBtn: document.getElementById('addLocationBtn'),
      locationList: document.getElementById('locationList'),
      // 表单 - 基本信息
      figureForm: document.getElementById('figureForm'),
      formName: document.getElementById('formName'),
      formDynasty: document.getElementById('formDynasty'),
      formDynastyCustom: document.getElementById('formDynastyCustom'),
      formBirthYear: document.getElementById('formBirthYear'),
      formDeathYear: document.getElementById('formDeathYear'),
      formOriginProvince: document.getElementById('formOriginProvince'),
      formOriginCounty: document.getElementById('formOriginCounty'),
      formOriginManualName: document.getElementById('formOriginManualName'),
      formOriginManualLat: document.getElementById('formOriginManualLat'),
      formOriginManualLng: document.getElementById('formOriginManualLng'),
      formOriginManualGroup: document.getElementById('formOriginManualGroup'),
      formCancelBtn: document.getElementById('formCancelBtn'),
      formSubmitBtn: document.getElementById('formSubmitBtn'),
      formError: document.getElementById('formError'),
      figureModal: document.getElementById('figureModal'),
      figureModalClose: document.getElementById('figureModalClose'),
      // 搜索
      locationSearch: document.getElementById('locationSearch'),
      searchResults: document.getElementById('searchResults'),
      // 事件表单
      eventModal: document.getElementById('eventModal'),
      eventForm: document.getElementById('eventForm'),
      eventYear: document.getElementById('eventYear'),
      eventType: document.getElementById('eventType'),
      eventTitle: document.getElementById('eventTitle'),
      eventDetail: document.getElementById('eventDetail'),
      eventWorks: document.getElementById('eventWorks'),
      eventLocationDisplay: document.getElementById('eventLocationDisplay'),
      eventSaveBtn: document.getElementById('eventSaveBtn'),
      eventCancelBtn: document.getElementById('eventCancelBtn'),
      // 确认对话框
      confirmDialog: document.getElementById('confirmDialog'),
      confirmMessage: document.getElementById('confirmMessage'),
      confirmYesBtn: document.getElementById('confirmYesBtn'),
      confirmNoBtn: document.getElementById('confirmNoBtn')
    };
  }

  function bindEvents() {
    // 人物选择切换
    els.figureSelect.addEventListener('change', (e) => {
      if (e.target.value === '__add__') {
        showAddForm();
        return;
      }
      if (e.target.value === '') {
        if (onFigureChange) onFigureChange(null);
        return;
      }
      if (onFigureChange) onFigureChange(e.target.value);
    });

    // 添加人物按钮（用箭头函数包装，避免事件对象被当作 figure 传入）
    els.addFigureBtn.addEventListener('click', () => showAddForm());

    // 表单提交
    els.figureForm.addEventListener('submit', handleFormSubmit);
    els.formCancelBtn.addEventListener('click', cancelForm);

    // 人物模态弹窗关闭
    if (els.figureModalClose) {
      els.figureModalClose.addEventListener('click', closeFigureModal);
    }
    if (els.figureModal) {
      els.figureModal.addEventListener('click', function (e) {
        if (e.target === els.figureModal) closeFigureModal();
      });
    }

    // 籍贯省→县联动
    els.formOriginProvince.addEventListener('change', () => {
      updateCountyOptions();
    });

    // 籍贯县选择 → 手动坐标显示
    els.formOriginCounty.addEventListener('change', () => {
      const province = els.formOriginProvince.value;
      if (els.formOriginCounty.value === '__manual__') {
        els.formOriginManualGroup.style.display = 'block';
      } else if (els.formOriginCounty.value && province) {
        const locKey = `${province}_${els.formOriginCounty.value}`;
        els.formOriginManualGroup.style.display = DataManager.getLocations()[locKey] ? 'none' : 'block';
      } else {
        els.formOriginManualGroup.style.display = 'none';
      }
    });

    // 搜索地点
    els.locationSearch.addEventListener('input', handleSearch);
    els.locationSearch.addEventListener('blur', () => {
      setTimeout(() => { els.searchResults.classList.remove('show'); }, 200);
    });
    els.locationSearch.addEventListener('focus', () => {
      if (els.locationSearch.value.trim()) handleSearch();
    });

    // 编辑面板关闭
    els.editPanelClose.addEventListener('click', exitEditMode);

    // 添加地点按钮（在编辑面板中另有独立按钮）
    if (els.addLocationBtn) {
      els.addLocationBtn.addEventListener('click', startAddLocation);
    }

    // 标签页切换
    els.tabTimelineBtn.addEventListener('click', () => switchTab('timeline'));
    els.tabWorksBtn.addEventListener('click', () => switchTab('works'));

    // 事件表单
    els.eventCancelBtn.addEventListener('click', closeEventModal);
    els.eventForm.addEventListener('submit', handleEventSubmit);

    // 数据管理
    els.dataExportBtn.addEventListener('click', handleExport);
    els.dataImportBtn.addEventListener('click', () => els.dataImportFile.click());
    els.dataImportFile.addEventListener('change', handleImport);

    // 确认对话框
    els.confirmNoBtn.addEventListener('click', closeConfirmDialog);

    // 点击外部关闭模态
    els.eventModal.addEventListener('click', (e) => {
      if (e.target === els.eventModal) closeEventModal();
    });

    // ============================================
    // 左侧人物列表事件
    // ============================================
    var toggleBtn = document.getElementById('toggleFigureListBtn');
    var figPanel = document.getElementById('figureListPanel');
    if (toggleBtn && figPanel) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        figPanel.classList.toggle('collapsed');
        toggleBtn.textContent = figPanel.classList.contains('collapsed') ? '▶' : '◀';
      });
      // 点击折叠的窄面板展开
      figPanel.addEventListener('click', function () {
        if (figPanel.classList.contains('collapsed')) {
          figPanel.classList.remove('collapsed');
          if (toggleBtn) toggleBtn.textContent = '◀';
        }
      });
    }

    // 左侧搜索过滤
    var figSearch = document.getElementById('figureListSearch');
    if (figSearch) {
      figSearch.addEventListener('input', function () {
        var figures = DataManager.getFigures();
        var currentId = currentFigure ? currentFigure.id : null;
        renderFigureList(figures, currentId);
      });
    }
  }

  // ============================================
  // 人物选择下拉刷新
  // ============================================
  function refreshFigureSelect(figures, selectedId) {
    els.figureSelect.innerHTML = '<option value="">— 选择人物 —</option>';
    figures.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name + ' (' + formatDynasty(f.dynasty) + ')';
      if (f.id === selectedId) opt.selected = true;
      els.figureSelect.appendChild(opt);
    });
    const addOpt = document.createElement('option');
    addOpt.value = '__add__';
    addOpt.textContent = '+ 添加新人物';
    els.figureSelect.appendChild(addOpt);

    // 同步刷新左侧人物列表
    renderFigureList(figures, selectedId);
  }

  // ============================================
  // 左侧人物列表面板
  // ============================================
  function renderFigureList(figures, selectedId) {
    var body = document.getElementById('figureListBody');
    if (!body) return;

    var searchVal = document.getElementById('figureListSearch').value.trim().toLowerCase();

    // 搜索过滤
    var filtered = figures;
    if (searchVal) {
      filtered = figures.filter(function (f) {
        return f.name.toLowerCase().indexOf(searchVal) >= 0;
      });
    }

    if (filtered.length === 0) {
      body.innerHTML = '<div class="fig-search-no-result">'
        + (searchVal
          ? '未找到匹配"<strong>' + escapeHtml(searchVal) + '</strong>"的人物'
          : '暂无人物<br><span style="font-size:0.72rem;">点击右上角 + 添加</span>')
        + '</div>';
      return;
    }

    // 按朝代分组
    var groups = {};
    filtered.forEach(function (f) {
      var key = formatDynasty(f.dynasty) || '未知';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });

    // 朝代排序：预设顺序优先，组合朝代按第一部分排序
    var dynastyOrder = DYNASTY_OPTIONS.slice();

    var keys = Object.keys(groups).sort(function (a, b) {
      if (a === '未知' && b === '未知') return 0;
      if (a === '未知') return 1;
      if (b === '未知') return -1;
      var aIdx = dynastyOrder.indexOf(a);
      var bIdx = dynastyOrder.indexOf(b);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      // 组合朝代（如"清·民国"）→ 按第一部分
      var aFirst = a.split('·')[0];
      var bFirst = b.split('·')[0];
      var afi = dynastyOrder.indexOf(aFirst);
      var bfi = dynastyOrder.indexOf(bFirst);
      if (afi >= 0 && bfi >= 0) return afi - bfi;
      if (afi >= 0) return -1;
      if (bfi >= 0) return 1;
      return a.localeCompare(b);
    });

    var html = '';
    keys.forEach(function (key) {
      html += '<div class="fig-group-header">' + escapeHtml(key) + '</div>';
      // 按出生年排序
      groups[key].sort(function (a, b) {
        return (a.birthYear || 9999) - (b.birthYear || 9999);
      });
      groups[key].forEach(function (f) {
        var active = f.id === selectedId ? ' active' : '';
        html += '<div class="fig-item' + active + '" data-id="' + f.id + '">'
          + '<span class="fig-name">' + escapeHtml(f.name) + '</span>'
          + '</div>';
      });
    });

    body.innerHTML = html;

    // 绑定点击事件
    body.querySelectorAll('.fig-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onFigureChange) onFigureChange(el.dataset.id);
      });
    });
  }

  // ============================================
  // 显示添加/编辑人物表单
  // ============================================
  let isEditingFigure = false;

  function showAddForm(figure) {
    try {
      isEditingFigure = !!figure;
      document.getElementById('formTitle').textContent = figure ? '编辑人物' : '添加新人物';

      if (figure) {
        els.formName.value = figure.name || '';
        // 加载朝代多选
        selectedDynasties.length = 0;
        if (figure.dynasty) {
          var dynasties = Array.isArray(figure.dynasty) ? figure.dynasty : [figure.dynasty];
          dynasties.forEach(function (d) { selectedDynasties.push(d); });
        }
        updateDynastyUI();
        els.formBirthYear.value = figure.birthYear || '';
        els.formDeathYear.value = figure.deathYear || '';
        if (figure.origin) {
          els.formOriginProvince.value = figure.origin.province || '';
          updateCountyOptions();
          // 尝试匹配县
          const countyOpts = els.formOriginCounty.querySelectorAll('option');
          for (const opt of countyOpts) {
            if (opt.textContent.includes(figure.origin.placeName)) {
              els.formOriginCounty.value = opt.value;
              break;
            }
          }
        }
      } else {
        resetForm();
      }

      // 显示模态弹窗
      if (els.figureModal) els.figureModal.classList.add('show');
      // 关闭引导覆盖层（如果有）
      if (els.guideOverlay) els.guideOverlay.classList.remove('show');
      console.log('showAddForm 完成');
    } catch (e) {
      console.error('showAddForm 出错:', e);
      alert('添加表单出错: ' + e.message);
    }
  }

  function resetForm() {
    els.formName.value = '';
    selectedDynasties.length = 0;
    updateDynastyUI();
    els.formDynastyCustom.value = '';
    els.formBirthYear.value = '';
    els.formDeathYear.value = '';
    els.formOriginProvince.value = '';
    els.formOriginCounty.innerHTML = '<option value="">先选择省</option>';
    els.formOriginManualName.value = '';
    els.formOriginManualLat.value = '';
    els.formOriginManualLng.value = '';
    els.formOriginManualGroup.style.display = 'none';
    els.formError.classList.remove('show');
  }

  function closeFigureModal() {
    if (els.figureModal) els.figureModal.classList.remove('show');
    if (!currentFigure) {
      if (els.guideOverlay) els.guideOverlay.classList.add('show');
    }
  }

  function cancelForm() {
    closeFigureModal();
  }

  function updateCountyOptions() {
    const province = els.formOriginProvince.value;
    els.formOriginCounty.innerHTML = '<option value="">— 选择县 —</option>';
    if (!province) {
      els.formOriginManualGroup.style.display = 'none';
      return;
    }

    const counties = DataManager.getCountiesByProvince(province);
    const seen = new Set();
    counties.forEach(c => {
      if (!seen.has(c.county)) {
        seen.add(c.county);
        const opt = document.createElement('option');
        opt.value = c.county;
        opt.textContent = c.county;
        els.formOriginCounty.appendChild(opt);
      }
    });
    els.formOriginCounty.appendChild(optionWithValue('__manual__', '手动输入坐标…'));
  }

  function optionWithValue(val, text) {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = text;
    return o;
  }

  function handleFormSubmit(e) {
    console.log('handleFormSubmit 开始执行');
    e.preventDefault();
    try {
      els.formError.classList.remove('show');

    // 验证
    const name = els.formName.value.trim();
    if (!name) {
      showFormError('姓名不能为空');
      els.formName.focus();
      return;
    }

    var dynasty = getSelectedDynasties();

    const birthYear = els.formBirthYear.value ? parseInt(els.formBirthYear.value) : null;
    const deathYear = els.formDeathYear.value ? parseInt(els.formDeathYear.value) : null;

    if (birthYear && deathYear && deathYear < birthYear) {
      showFormError('卒年不能早于生年');
      return;
    }

    // 籍贯
    let origin = null;
    let province = els.formOriginProvince.value;
    let county = els.formOriginCounty.value;

    // 策略1: 用户明确选择 __manual__ → 读取手动输入的县名+坐标
    if (county === '__manual__') {
      const manualName = els.formOriginManualName.value.trim();
      if (manualName && province) {
        const lat = parseFloat(els.formOriginManualLat.value);
        const lng = parseFloat(els.formOriginManualLng.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          origin = {
            placeName: manualName,
            province: province,
            county: manualName,
            lat: lat,
            lng: lng
          };
        }
      }
    // 策略2: 从下拉选择了具体县 → 尝试数据库匹配，失败则回退手动坐标
    } else if (county && province) {
      const locKey = province + '_' + county;
      const locData = DataManager.getLocations()[locKey];
      if (locData) {
        origin = {
          placeName: county,
          province: province,
          county: county,
          lat: locData.lat,
          lng: locData.lng
        };
      } else {
        // 县不在数据库中，尝试手动坐标字段
        const lat = parseFloat(els.formOriginManualLat.value);
        const lng = parseFloat(els.formOriginManualLng.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          origin = {
            placeName: county,
            province: province,
            county: county,
            lat: lat,
            lng: lng
          };
        }
      }
    }

    // 策略3: 兜底——只要选了省且手动字段有值就尝试创建
    if (!origin && province) {
      const manualName = els.formOriginManualName.value.trim();
      const lat = parseFloat(els.formOriginManualLat.value);
      const lng = parseFloat(els.formOriginManualLng.value);
      if (manualName && !isNaN(lat) && !isNaN(lng)) {
        origin = {
          placeName: manualName,
          province: province,
          county: manualName,
          lat: lat,
          lng: lng
        };
        console.log('籍贯: 通过兜底策略创建', origin);
      }
    }

    console.log('表单数据:', { name, dynasty, birthYear, deathYear, province, county, origin });

    // 构建人物数据
    const figureData = {
      name: name,
      dynasty: dynasty,
      birthYear: birthYear,
      deathYear: deathYear,
      origin: origin,
      trajectory: [],
      worksIndex: []
    };

    if (isEditingFigure && currentFigure) {
      figureData.id = currentFigure.id;
      figureData.trajectory = currentFigure.trajectory || [];
      figureData.worksIndex = currentFigure.worksIndex || [];
      DataManager.updateFigure(currentFigure.id, figureData);
      showToast('人物已更新');
    } else {
      figureData.id = DataManager.generateId(name);
      DataManager.addFigure(figureData);
      showToast('人物已添加');
    }

    // 关闭模态弹窗
    if (els.figureModal) els.figureModal.classList.remove('show');

    // 刷新
    if (onFigureChange) {
      onFigureChange(figureData.id);
    }
    console.log('handleFormSubmit 完成, figureId:', figureData.id);
    } catch (err) {
      console.error('handleFormSubmit 出错:', err);
      alert('保存失败: ' + err.message);
    }
  }

  function showFormError(msg) {
    els.formError.textContent = msg;
    els.formError.classList.add('show');
  }

  // ============================================
  // 编辑模式
  // ============================================
  function enterEditMode(figure) {
    editingMode = true;
    currentFigure = figure;
    els.editPanel.classList.remove('hidden');
    els.editPanelClose.style.display = 'block';
    renderEditPanel(figure);
  }

  function exitEditMode() {
    editingMode = false;
    els.editPanel.classList.add('hidden');
    els.editPanelClose.style.display = 'none';
    if (onFigureChange) onFigureChange(currentFigure ? currentFigure.id : null);
  }

  function renderEditPanel(figure) {
    if (!figure) return;
    els.editPanelBody.innerHTML = '';

    // 基本信息摘要
    const infoDiv = document.createElement('div');
    infoDiv.className = 'panel-section';
    infoDiv.innerHTML = `
      <h3>${figure.name}</h3>
      <div class="figure-info-display">
        <div class="info-row"><span class="info-label">朝代</span><span class="info-value">${formatDynasty(figure.dynasty)}</span></div>
        <div class="info-row"><span class="info-label">生卒</span><span class="info-value">${figure.birthYear || '?'} — ${figure.deathYear || '?'}</span></div>
        <div class="info-row"><span class="info-label">籍贯</span><span class="info-value">${figure.origin ? figure.origin.province + '·' + figure.origin.placeName : '未设置'}</span></div>
      </div>
    `;
    els.editPanelBody.appendChild(infoDiv);

    // 添加地点按钮
    const addBtnDiv = document.createElement('div');
    addBtnDiv.className = 'panel-section';
    addBtnDiv.innerHTML = `
      <button class="btn btn-primary" id="editAddLocationBtn" style="width:100%">
        + 添加地点
      </button>
      <div style="margin-top:8px">
        <input type="text" class="form-control" id="editLocationSearch" placeholder="搜索县名..." />
        <div class="search-results" id="editSearchResults"></div>
      </div>
      <div style="margin-top:8px;font-size:0.78rem;color:#8C7A6A;">
        搜索县名直接添加地点
      </div>
    `;
    els.editPanelBody.appendChild(addBtnDiv);

    // 地点列表
    const locDiv = document.createElement('div');
    locDiv.className = 'panel-section';
    locDiv.innerHTML = '<h3>轨迹地点</h3><div id="editLocationList"></div>';
    els.editPanelBody.appendChild(locDiv);

    // 绑定事件
    document.getElementById('editAddLocationBtn').addEventListener('click', () => {
      startAddLocationInEdit(figure);
    });

    const searchInput = document.getElementById('editLocationSearch');
    const searchResultsDiv = document.getElementById('editSearchResults');

    // 编辑面板搜索（高德 + 本地）
    var editSearchTimer = null;
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim();
      if (!q) { searchResultsDiv.classList.remove('show'); return; }

      clearTimeout(editSearchTimer);
      editSearchTimer = setTimeout(function () {
        searchAmap(q, function (amapResults) {
          var results = amapResults.length > 0 ? amapResults : DataManager.searchLocations(q);
          renderEditSearchResults(results, q, figure);
        });
      }, 300);
    });

    // 提取公共渲染函数
    function renderEditSearchResults(results, q, fig) {
      if (results.length === 0) {
        searchResultsDiv.innerHTML =
          '<div class="search-result-item" style="color:#8C7A6A;">未找到匹配地点</div>' +
          '<div class="search-result-item add-manual" data-q="' + q + '" style="color:#8B0000;font-weight:700;">' +
            '+ 手动添加"' + q + '"' +
          '</div>';
        searchResultsDiv.classList.add('show');
        bindEditSearchEvents(fig);
        return;
      }

      searchResultsDiv.innerHTML = results.map(function (r) {
        var label = r.county || r.name || '';
        var province = r.province || '';
        var source = r._source === 'amap' ? '高德' : '本地';
        return '<div class="search-result-item" ' +
          'data-lat="' + (r.lat || '') + '" data-lng="' + (r.lng || '') + '" ' +
          'data-province="' + province + '" data-county="' + label + '" ' +
          'style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span><strong>' + label + '</strong> <span class="sr-province">' + province + '</span></span>' +
          '<span style="font-size:0.65rem;color:#B8A898;">' + source + '</span>' +
          '</div>';
      }).join('');
      searchResultsDiv.classList.add('show');
      bindEditSearchEvents(fig);
    }

    function bindEditSearchEvents(fig) {
      searchResultsDiv.querySelectorAll('.search-result-item').forEach(function (el) {
        el.addEventListener('mousedown', function (e) {
          var lat = parseFloat(e.currentTarget.dataset.lat);
          var lng = parseFloat(e.currentTarget.dataset.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            var province = e.currentTarget.dataset.province;
            var county = e.currentTarget.dataset.county;
            searchInput.value = province + '·' + county;
            searchResultsDiv.classList.remove('show');
            addLocationToFigure(fig, lat, lng, county, province);
          } else if (e.currentTarget.classList.contains('add-manual')) {
            searchInput.value = e.currentTarget.dataset.q;
            searchResultsDiv.classList.remove('show');
            promptForManualLocation(fig, e.currentTarget.dataset.q);
          }
        });
      });
    }

    searchInput.addEventListener('blur', () => {
      setTimeout(() => { searchResultsDiv.classList.remove('show'); }, 200);
    });

    renderEditLocationList(figure);
  }

  function renderEditLocationList(figure) {
    const listDiv = document.getElementById('editLocationList');
    if (!listDiv) return;
    if (!figure.trajectory || figure.trajectory.length === 0) {
      listDiv.innerHTML = '<div style="color:#8C7A6A;font-size:0.85rem;padding:8px 0;">尚未添加地点</div>';
      return;
    }

    listDiv.innerHTML = '';
    const sorted = [...figure.trajectory].sort((a, b) => {
      const aMin = a.events && a.events.length > 0 ? Math.min(...a.events.map(e => e.year || 0)) : Infinity;
      const bMin = b.events && b.events.length > 0 ? Math.min(...b.events.map(e => e.year || 0)) : Infinity;
      return aMin - bMin;
    });

    sorted.forEach((point, idx) => {
      const realIdx = figure.trajectory.indexOf(point);
      const item = document.createElement('div');
      item.className = 'location-item';
      const eventDesc = point.events && point.events.length > 0
        ? point.events.map(e => `<div class="loc-event">${e.year} · <span class="type-tag type-${e.type}">${e.type}</span> ${e.title}</div>`).join('')
        : '<div style="color:#8C7A6A;font-size:0.78rem;">暂无事件</div>';

      item.innerHTML = `
        <div class="loc-name">${point.placeName}</div>
        <div class="loc-coords">${point.province} · ${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}</div>
        <div class="loc-events">${eventDesc}</div>
        <div style="margin-top:6px;display:flex;gap:4px;">
          <button class="btn btn-sm btn-add-event" data-idx="${realIdx}">+事件</button>
          <button class="btn btn-sm btn-danger loc-del" data-idx="${realIdx}">删除</button>
          <button class="btn btn-sm btn-fly" data-lat="${point.lat}" data-lng="${point.lng}">定位</button>
        </div>
      `;
      listDiv.appendChild(item);

      // 绑定事件
      item.querySelector('.btn-add-event').addEventListener('click', () => {
        showEventForm(figure, realIdx, point);
      });
      item.querySelector('.loc-del').addEventListener('click', () => {
        showConfirm(`确定删除"${point.placeName}"？`, () => {
          deleteLocation(figure, realIdx);
        });
      });
      item.querySelector('.btn-fly').addEventListener('click', () => {
        if (onFlyTo) onFlyTo(point.lat, point.lng);
      });
    });
  }

  // ============================================
  // 添加地点
  // ============================================
  function startAddLocation() {
    if (!currentFigure) return;
    enterEditMode(currentFigure);
  }

  function startAddLocationInEdit(figure) {
    showToast('在地图上点击选择位置，或搜索县名');
    MapModule.setMapClickHandler((latlng) => {
      const placeName = prompt('请输入地点名称：');
      if (!placeName) return;
      const province = prompt('请输入所属省/直隶：') || '未知';
      addLocationToFigure(figure, latlng.lat, latlng.lng, placeName, province);
      MapModule.setMapClickHandler(null);
    });
  }

  function addLocationToFigure(figure, lat, lng, placeName, province) {
    // 检查是否已存在同地点
    if (figure.trajectory && figure.trajectory.some(t => t.placeName === placeName && t.province === province)) {
      showConfirm(`"${placeName}"已存在，是否仍要添加？`, () => {
        doAddLocation(figure, lat, lng, placeName, province);
      });
      return;
    }
    doAddLocation(figure, lat, lng, placeName, province);
  }

  function doAddLocation(figure, lat, lng, placeName, province) {
    DataManager.addTrajectoryPoint(figure.id, {
      placeName: placeName,
      province: province,
      county: placeName,
      lat: lat,
      lng: lng,
      events: []
    });
    showToast(`已添加地点：${placeName}`);

    // 刷新编辑面板
    const updatedFig = DataManager.getFigure(figure.id);
    if (updatedFig) {
      currentFigure = updatedFig;
      renderEditPanel(updatedFig);
      MapModule.renderFigure(updatedFig);
    }
  }

  function promptForManualLocation(figure, placeName) {
    const lat = prompt(`请输入"${placeName}"的纬度（如 39.90）：`);
    if (!lat || isNaN(parseFloat(lat))) { showToast('已取消'); return; }
    const lng = prompt(`请输入"${placeName}"的经度（如 116.40）：`);
    if (!lng || isNaN(parseFloat(lng))) { showToast('已取消'); return; }
    const province = prompt(`请输入"${placeName}"所属省：`) || '未知';
    addLocationToFigure(figure, parseFloat(lat), parseFloat(lng), placeName, province);
  }

  function deleteLocation(figure, idx) {
    DataManager.removeTrajectoryPoint(figure.id, idx);
    const updatedFig = DataManager.getFigure(figure.id);
    if (updatedFig) {
      currentFigure = updatedFig;
      renderEditPanel(updatedFig);
      MapModule.renderFigure(updatedFig);
    }
    showToast('地点已删除');
  }

  // ============================================
  // 事件表单
  // ============================================
  let eventFigureId = null;
  let eventPointIdx = null;

  function showEventForm(figure, idx, point) {
    eventFigureId = figure.id;
    eventPointIdx = idx;
    els.eventLocationDisplay.textContent = `${point.province} · ${point.placeName}`;
    els.eventYear.value = '';
    els.eventType.value = '其他';
    els.eventTitle.value = '';
    els.eventDetail.value = '';
    els.eventWorks.value = '';
    els.eventModal.classList.add('show');
    els.eventYear.focus();
  }

  function closeEventModal() {
    els.eventModal.classList.remove('show');
    eventFigureId = null;
    eventPointIdx = null;
  }

  function handleEventSubmit(e) {
    try {
      e.preventDefault();
      const year = parseInt(els.eventYear.value);
      if (!year || isNaN(year)) {
        showToast('请输入有效年份');
        return;
      }
      const type = els.eventType.value;
      const title = els.eventTitle.value.trim();
      if (!title) {
        showToast('请输入事件标题');
        return;
      }
      const detail = els.eventDetail.value.trim();
      const worksRaw = els.eventWorks.value.trim();
      const works = worksRaw ? worksRaw.split('\n').map(s => s.trim()).filter(s => s) : [];

      // 提前保存 ID（closeEventModal 会清零）
      var figId = eventFigureId;
      var ptIdx = eventPointIdx;

      DataManager.addEvent(figId, ptIdx, {
        year: year,
        type: type,
        title: title,
        detail: detail,
        works: works
      });

      closeEventModal();

      const figure = DataManager.getFigure(figId);
      if (figure) {
        currentFigure = figure;
        try { renderEditPanel(figure); } catch (ee) { console.warn('renderEditPanel 出错:', ee); }
        MapModule.renderFigure(figure);
        updateSidePanel(figure);
      }

      showToast('事件已保存');
    } catch (e) {
      console.error('handleEventSubmit 出错:', e);
      showToast('保存事件失败: ' + e.message);
    }
  }

  // ============================================
  // 搜索地点（高德 API + 本地备用）
  // ============================================
  function handleSearch() {
    var q = els.locationSearch.value.trim();
    if (!q) {
      els.searchResults.classList.remove('show');
      return;
    }

    // 先尝试高德 API 搜索
    searchAmap(q, function (amapResults) {
      if (amapResults.length > 0) {
        renderSearchResults(amapResults);
        return;
      }
      // 高德无结果 → 本地搜索
      var localResults = DataManager.searchLocations(q);
      renderSearchResults(localResults);
    });
  }

  function renderSearchResults(results) {
    if (!results || results.length === 0) {
      els.searchResults.innerHTML = '<div class="search-result-item" style="color:#8C7A6A;">无匹配地点</div>';
      els.searchResults.classList.add('show');
      return;
    }

    els.searchResults.innerHTML = results.map(function (r) {
      var label = r.county || r.name || '';
      var province = r.province || '';
      var lat = r.lat || '';
      var lng = r.lng || '';
      var source = r._source === 'amap' ? '高德' : '本地';
      return '<div class="search-result-item" ' +
        'data-lat="' + lat + '" data-lng="' + lng + '" ' +
        'data-province="' + province + '" data-county="' + label + '" ' +
        'style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span><strong>' + label + '</strong> <span class="sr-province">' + province + '</span></span>' +
        '<span style="font-size:0.65rem;color:#B8A898;">' + source + '</span>' +
        '</div>';
    }).join('');
    els.searchResults.classList.add('show');

    els.searchResults.querySelectorAll('.search-result-item').forEach(function (el) {
      el.addEventListener('mousedown', function (e) {
        var lat = parseFloat(e.currentTarget.dataset.lat);
        var lng = parseFloat(e.currentTarget.dataset.lng);
        var province = e.currentTarget.dataset.province;
        var county = e.currentTarget.dataset.county;
        els.searchResults.classList.remove('show');
        els.locationSearch.value = province + '·' + county;
        if (!isNaN(lat) && !isNaN(lng)) {
          // 如果有当前人物，加入轨迹
          if (currentFigure) {
            addLocationToFigure(currentFigure, lat, lng, county, province);
          }
          if (onFlyTo) {
            onFlyTo(lat, lng);
          }
        }
      });
    });
  }

  // ============================================
  // 侧边面板更新
  // ============================================
  function updateSidePanel(figure) {
    try {
      // 确保模态弹窗关闭
      if (els.figureModal) els.figureModal.classList.remove('show');

      if (!figure) {
        els.figureInfoDisplay.style.display = 'none';
        els.timelineContent.innerHTML = '<div style="padding:12px;color:#8C7A6A;text-align:center;">请选择或添加人物</div>';
        els.worksContent.innerHTML = '';
        return;
      }

      currentFigure = figure;
      els.figureInfoDisplay.style.display = 'block';
      els.guideOverlay.classList.remove('show');
      if (els.locationSearch) {
        els.locationSearch.placeholder = '搜索地点...';
      }

      // ============================================
      // 人物信息区
      // ============================================
      var originText = '未设置';
      if (figure.origin) {
        originText = (figure.origin.province || '') + ' · ' + (figure.origin.placeName || '');
      }
      var birthText = figure.birthYear || '?';
      var deathText = figure.deathYear || '?';
      var ageText = '';
      var birthNum = parseInt(figure.birthYear);
      var deathNum = parseInt(figure.deathYear);
      if (!isNaN(birthNum) && !isNaN(deathNum)) {
        var age = deathNum - birthNum;
        if (age >= 0) {
          ageText = '（享年' + age + '岁）';
        }
      } else if (!isNaN(birthNum) && isNaN(deathNum)) {
        // 只有生年，卒年未知
      }

      els.figureInfoDisplay.innerHTML =
        '<div class="panel-section">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
            '<div>' +
              '<h3 style="font-size:1.15rem;border:none;padding:0;margin:0;color:#5C4033;">' +
                escapeHtml(figure.name) +
              '</h3>' +
              '<div style="font-size:0.8rem;color:#8C7A6A;margin-top:2px;">' +
                escapeHtml(formatDynasty(figure.dynasty)) +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="figure-info-display" style="margin-top:8px;font-size:0.85rem;">' +
            '<div class="info-row"><span class="info-label">生卒</span><span class="info-value">' + birthText + ' — ' + deathText + ageText + '</span></div>' +
            '<div class="info-row"><span class="info-label">籍贯</span><span class="info-value">' + originText + '</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">' +
            '<button class="btn btn-primary btn-sm" id="addTrackBtn" style="flex:1;min-width:100px;">+ 添加轨迹地点</button>' +
            '<button class="btn btn-sm" id="editFigureBtn2" style="flex-shrink:0;">编辑</button>' +
            '<button class="btn btn-sm btn-danger" id="deleteFigureBtn2" style="flex-shrink:0;">删除</button>' +
          '</div>' +
        '</div>';

      // ============================================
      // 绑定操作按钮
      // ============================================
      var addTrackBtn = document.getElementById('addTrackBtn');
      if (addTrackBtn) {
        addTrackBtn.addEventListener('click', function () {
          startAddLocationForFigure(figure);
        });
      }

      var editBtn = document.getElementById('editFigureBtn2');
      if (editBtn) {
        editBtn.addEventListener('click', function () {
          showAddForm(figure);
        });
      }

      var delBtn = document.getElementById('deleteFigureBtn2');
      if (delBtn) {
        delBtn.addEventListener('click', function () {
          showConfirm('确定删除人物"' + figure.name + '"？此操作不可恢复。', function () {
            DataManager.deleteFigure(figure.id);
            if (onFigureChange) onFigureChange(null);
            showToast('人物已删除');
          });
        });
      }

      // ============================================
      // 时间线
      // ============================================
      renderTimeline(figure);

      // ============================================
      // 著作索引
      // ============================================
      renderWorks(figure);

      // 完成（由 renderTimeline/renderWorks 处理具体渲染）
    } catch (e) {
      console.error('updateSidePanel 出错:', e);
    }
  }

  // ============================================
  // 渲染时间线
  // ============================================
  function renderTimeline(figure) {
    try {
      if (!figure.trajectory || figure.trajectory.length === 0) {
        els.timelineContent.innerHTML = '<div style="padding:16px;color:#8C7A6A;text-align:center;font-size:0.85rem;">' +
          '暂无轨迹地点。<br>点击上方"添加轨迹地点"按钮开始添加。</div>';
        return;
      }

      // 按最早事件年份排序
      var sorted = [...figure.trajectory].sort(function(a, b) {
        var aMin = a.events && a.events.length > 0
          ? Math.min.apply(null, a.events.map(function(e) { return e.year || 0; }))
          : Infinity;
        var bMin = b.events && b.events.length > 0
          ? Math.min.apply(null, b.events.map(function(e) { return e.year || 0; }))
          : Infinity;
        return aMin - bMin;
      });

      var html = '<ul class="timeline-list">';
      for (var t = 0; t < sorted.length; t++) {
        var point = sorted[t];

        if (point.events && point.events.length > 0) {
          // 有事件 → 逐个渲染
          var sortedEvents = [...point.events].sort(function(a, b) { return (a.year || 0) - (b.year || 0); });
          for (var e = 0; e < sortedEvents.length; e++) {
            var evt = sortedEvents[e];
            var detailHtml = evt.detail
              ? '<div style="font-size:0.78rem;color:#6B5B4F;margin-top:2px;">' + escapeHtml(evt.detail) + '</div>'
              : '';
            var worksHtml = (evt.works && evt.works.length > 0)
              ? '<div style="font-size:0.75rem;color:#2F4F4F;margin-top:2px;">📖 ' + evt.works.join('、') + '</div>'
              : '';
            html += '<li class="timeline-item" data-lat="' + (point.lat || '') + '" data-lng="' + (point.lng || '') + '">' +
              '<div>' +
                '<span class="tl-year">' + (evt.year || '?') + '</span> ' +
                '<span class="type-tag type-' + evt.type + '">' + evt.type + '</span> ' +
                '<span class="tl-place">' + (point.province || '') + '·' + (point.placeName || '') + '</span>' +
              '</div>' +
              '<div class="tl-title">' + escapeHtml(evt.title || '') + '</div>' +
              detailHtml +
              worksHtml +
            '</li>';
          }
        } else {
          // 无事件 → 显示轨迹点本身
          html += '<li class="timeline-item" data-lat="' + (point.lat || '') + '" data-lng="' + (point.lng || '') + '">' +
            '<div>' +
              '<span class="tl-year">—</span> ' +
              '<span class="type-tag type-其他">途经</span> ' +
              '<span class="tl-place">' + (point.province || '') + '·' + (point.placeName || '') + '</span>' +
            '</div>' +
            '<div class="tl-title">抵达 ' + escapeHtml(point.placeName || '') + '</div>' +
          '</li>';
        }
      }
      html += '</ul>';
      els.timelineContent.innerHTML = html;

      // 时间线点击 → 地图跳转
      var items = els.timelineContent.querySelectorAll('.timeline-item');
      for (var j = 0; j < items.length; j++) {
        items[j].addEventListener('click', function () {
          var lat = parseFloat(this.dataset.lat);
          var lng = parseFloat(this.dataset.lng);
          if (!isNaN(lat) && !isNaN(lng) && onFlyTo) {
            onFlyTo(lat, lng);
          }
        });
      }
    } catch (e) {
      console.error('renderTimeline 出错:', e);
    }
  }

  // ============================================
  // 渲染著作索引
  // ============================================
  function renderWorks(figure) {
    try {
      if (figure.worksIndex && figure.worksIndex.length > 0) {
        var html = '<ul class="works-list">';
        for (var i = 0; i < figure.worksIndex.length; i++) {
          var w = figure.worksIndex[i];
          var locKey = (w.province || '') + '_' + (w.placeName || '');
          var loc = DataManager.getLocations()[locKey];
          var lat = loc ? loc.lat : null;
          var lng = loc ? loc.lng : null;
          if ((!lat || !lng) && figure.trajectory) {
            for (var t = 0; t < figure.trajectory.length; t++) {
              if (figure.trajectory[t].placeName === w.placeName) {
                lat = figure.trajectory[t].lat;
                lng = figure.trajectory[t].lng;
                break;
              }
            }
          }
          html += '<li class="works-item" data-lat="' + (lat || '') + '" data-lng="' + (lng || '') + '">' +
            '<div class="w-title">' + escapeHtml(w.title || '') + '</div>' +
            '<div class="w-meta">' + (w.year || '?') + ' · ' + (w.province || '') + (w.placeName ? '·' + w.placeName : '') + ' · ' + (w.type || '') + '</div>' +
          '</li>';
        }
        html += '</ul>';
        els.worksContent.innerHTML = html;

        var items = els.worksContent.querySelectorAll('.works-item');
        for (var j = 0; j < items.length; j++) {
          items[j].addEventListener('click', function () {
            var lat = parseFloat(this.dataset.lat);
            var lng = parseFloat(this.dataset.lng);
            if (!isNaN(lat) && !isNaN(lng) && onFlyTo) {
              onFlyTo(lat, lng);
            }
          });
        }
      } else {
        els.worksContent.innerHTML = '<div style="padding:16px;color:#8C7A6A;text-align:center;font-size:0.85rem;">暂无著作记录</div>';
      }
    } catch (e) {
      console.error('renderWorks 出错:', e);
    }
  }

  // ============================================
  // HTML 转义（防 XSS）
  // ============================================
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================================
  // 高德地图地理编码搜索（JSONP）
  // ============================================
  function searchAmap(keywords, callback) {
    var key = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.amapKey : '';
    if (!key) {
      callback([]);
      return;
    }
    var callbackName = '_amap_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var timeout = setTimeout(function () {
      delete window[callbackName];
      callback([]);
    }, 5000);

    window[callbackName] = function (data) {
      clearTimeout(timeout);
      delete window[callbackName];
      try {
        if (data && data.status === '1' && Array.isArray(data.pois) && data.pois.length > 0) {
          var seen = new Set();
          var results = [];
          for (var i = 0; i < data.pois.length; i++) {
            var p = data.pois[i];
            var locParts = (p.location || '').split(',');
            var lng = parseFloat(locParts[0]);
            var lat = parseFloat(locParts[1]);
            if (isNaN(lat) || isNaN(lng)) continue;
            // 按 district 去重
            var key_ = p.pname + '_' + p.adname;
            if (seen.has(key_)) continue;
            seen.add(key_);
            results.push({
              name: p.name,
              province: p.pname,
              city: p.cityname || p.pname,
              county: p.adname,
              lat: lat,
              lng: lng,
              _source: 'amap'
            });
          }
          callback(results);
        } else {
          callback([]);
        }
      } catch (e) {
        callback([]);
      }
    };

    var script = document.createElement('script');
    script.src = 'https://restapi.amap.com/v3/place/text?keywords=' + encodeURIComponent(keywords) + '&city=%E5%85%A8%E5%9B%BD&key=' + key + '&output=JSON&callback=' + callbackName + '&offset=10&extensions=base';
    document.body.appendChild(script);
    script.onload = function () { document.body.removeChild(script); };
    script.onerror = function () {
      clearTimeout(timeout);
      delete window[callbackName];
      document.body.removeChild(script);
      callback([]);
    };
  }

  // ============================================
  // 直接添加轨迹地点（不进编辑模式）
  // ============================================
  var _pendingFigure = null;
  var _pendingLat = null;
  var _pendingLng = null;

  function startAddLocationForFigure(figure) {
    try {
      _pendingFigure = figure;
      showToast('在地图上点击选择位置');
      MapModule.setMapClickHandler(function (latlng) {
        _pendingLat = latlng.lat;
        _pendingLng = latlng.lng;
        MapModule.setMapClickHandler(null);
        // 弹窗询问地点名称
        promptForLocationName();
      });
      // 如果已有搜索输入框，聚焦
      if (els.locationSearch) {
        els.locationSearch.focus();
        els.locationSearch.placeholder = '搜索县名，或点击地图选择位置…';
      }
    } catch (e) {
      console.error('startAddLocationForFigure 出错:', e);
      showToast('操作失败: ' + e.message);
    }
  }

  function promptForLocationName() {
    try {
      var placeName = prompt('请输入地点名称（如：湘阴县）：');
      if (!placeName || !placeName.trim()) {
        showToast('已取消');
        _pendingFigure = null;
        _pendingLat = null;
        _pendingLng = null;
        return;
      }
      var province = prompt('请输入所属省（如：湖南）：') || '未知';

      // 添加到轨迹
      var figure = _pendingFigure;
      var lat = _pendingLat;
      var lng = _pendingLng;

      // 清理临时状态
      _pendingFigure = null;
      _pendingLat = null;
      _pendingLng = null;

      // 检查重复
      if (figure.trajectory && figure.trajectory.some(function (t) {
        return t.placeName === placeName.trim() && t.province === province;
      })) {
        showConfirm('"' + placeName.trim() + '"已存在，是否仍要添加？', function () {
          doAddTrackPoint(figure, lat, lng, placeName.trim(), province);
        });
        return;
      }
      doAddTrackPoint(figure, lat, lng, placeName.trim(), province);
    } catch (e) {
      console.error('promptForLocationName 出错:', e);
      showToast('操作失败: ' + e.message);
    }
  }

  function doAddTrackPoint(figure, lat, lng, placeName, province) {
    try {
      // 先添加轨迹点（无事件）
      var point = {
        placeName: placeName,
        province: province,
        county: placeName,
        lat: lat,
        lng: lng,
        events: []
      };
      DataManager.addTrajectoryPoint(figure.id, point);

      // 找到刚添加的点在 trajectory 中的索引
      var updatedFig = DataManager.getFigure(figure.id);
      var pointIndex = -1;
      if (updatedFig && updatedFig.trajectory) {
        for (var i = 0; i < updatedFig.trajectory.length; i++) {
          if (updatedFig.trajectory[i].placeName === placeName &&
              updatedFig.trajectory[i].province === province &&
              updatedFig.trajectory[i].lat === lat &&
              updatedFig.trajectory[i].lng === lng) {
            pointIndex = i;
            break;
          }
        }
      }

      showToast('已添加地点：' + placeName);

      // 刷新地图
      MapModule.renderFigure(updatedFig || figure);

      // 弹出事件表单
      if (pointIndex >= 0) {
        showEventForm(updatedFig || figure, pointIndex, (updatedFig || figure).trajectory[pointIndex]);
      }
    } catch (e) {
      console.error('doAddTrackPoint 出错:', e);
      showToast('添加地点失败: ' + e.message);
    }
  }

  // ============================================
  // 标签页
  // ============================================
  function switchTab(tab) {
    els.tabTimelineBtn.classList.toggle('active', tab === 'timeline');
    els.tabWorksBtn.classList.toggle('active', tab === 'works');
    els.tabTimeline.classList.toggle('active', tab === 'timeline');
    els.tabWorks.classList.toggle('active', tab === 'works');
  }

  // ============================================
  // 数据导入导出
  // ============================================
  function handleExport() {
    const data = DataManager.exportData();
    DataManager.downloadJSON(data, 'figures.json');
    showToast('数据已导出');
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await DataManager.uploadJSON(file);
      showConfirm('选择导入方式：', () => {
        DataManager.importData(data, 'merge');
        showToast('数据已合并导入');
        if (onFigureChange) onFigureChange(null);
      }, () => {
        DataManager.importData(data, 'overwrite');
        showToast('数据已覆盖导入');
        if (onFigureChange) onFigureChange(null);
      }, '合并', '覆盖');
    } catch (err) {
      showToast('导入失败：' + err.message);
    }
    e.target.value = '';
  }

  // ============================================
  // 确认对话框
  // ============================================
  let confirmCallback = null;
  let confirmCancelCallback = null;

  function showConfirm(msg, onYes, onNo, yesText, noText) {
    els.confirmMessage.textContent = msg;
    els.confirmDialog.classList.add('show');
    confirmCallback = onYes || null;
    confirmCancelCallback = onNo || null;

    els.confirmYesBtn.textContent = yesText || '确定';
    els.confirmNoBtn.textContent = noText || '取消';

    // 重新绑定
    els.confirmYesBtn.onclick = () => {
      els.confirmDialog.classList.remove('show');
      if (confirmCallback) confirmCallback();
      confirmCallback = null;
      confirmCancelCallback = null;
    };
    els.confirmNoBtn.onclick = () => {
      els.confirmDialog.classList.remove('show');
      if (confirmCancelCallback) confirmCancelCallback();
      confirmCallback = null;
      confirmCancelCallback = null;
    };
  }

  function closeConfirmDialog() {
    els.confirmDialog.classList.remove('show');
  }

  // ============================================
  // Toast 提示
  // ============================================
  let toastTimer = null;

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ============================================
  // 设置回调
  // ============================================
  function setCallbacks(cbs) {
    if (cbs.onFigureChange) onFigureChange = cbs.onFigureChange;
    if (cbs.onAddFigure) onAddFigure = cbs.onAddFigure;
    if (cbs.onDeleteFigure) onDeleteFigure = cbs.onDeleteFigure;
    if (cbs.onAddLocation) onAddLocation = cbs.onAddLocation;
    if (cbs.onAddEvent) onAddEvent = cbs.onAddEvent;
    if (cbs.onDeleteLocation) onDeleteLocation = cbs.onDeleteLocation;
    if (cbs.onDeleteEvent) onDeleteEvent = cbs.onDeleteEvent;
    if (cbs.onFlyTo) onFlyTo = cbs.onFlyTo;
  }

  return {
    init,
    refreshFigureSelect,
    updateSidePanel,
    enterEditMode,
    exitEditMode,
    setCallbacks,
    showToast,
    showConfirm,
    showAddForm,
    cancelForm,
    handleFormSubmit
  };
})();
