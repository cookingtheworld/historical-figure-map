/* ============================================
   GitHub Gist 云端同步模块
   ============================================ */

const GistSync = (() => {
  var TOKEN_KEY = 'gist_sync_token';
  var GIST_ID_KEY = 'gist_sync_gist_id';
  var GIST_FILENAME = 'historical-figures-data.json';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; }
    catch (e) { return ''; }
  }

  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
  }

  function getGistId() {
    try { return localStorage.getItem(GIST_ID_KEY) || ''; }
    catch (e) { return ''; }
  }

  function setGistId(id) {
    try { localStorage.setItem(GIST_ID_KEY, id); } catch (e) {}
  }

  function clearConfig() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(GIST_ID_KEY);
    } catch (e) {}
  }

  function isConfigured() {
    return !!getToken();
  }

  // 从 Gist 读取数据
  async function fetchFromGist() {
    var token = getToken();
    var gistId = getGistId();
    if (!token || !gistId) return null;

    var response = await fetch('https://api.github.com/gists/' + gistId, {
      headers: { 'Authorization': 'token ' + token }
    });

    if (response.status === 404) {
      // Gist 已被删除 → 清除 GistId，下次重新创建
      setGistId('');
      return null;
    }
    if (!response.ok) {
      throw new Error('读取 Gist 失败: ' + response.status);
    }

    var data = await response.json();
    if (data.files && data.files[GIST_FILENAME]) {
      return JSON.parse(data.files[GIST_FILENAME].content);
    }
    return null;
  }

  // 调试日志（Token 脱敏）
  function debugLog(label, url, headers, body) {
    var safeHeaders = {};
    if (headers) {
      for (var k in headers) {
        safeHeaders[k] = k === 'Authorization'
          ? (headers[k].slice(0, 8) + '****')
          : headers[k];
      }
    }
    console.log('[GistSync] ' + label);
    console.log('  URL:', url);
    console.log('  Headers:', safeHeaders);
    if (body) console.log('  Body:', typeof body === 'string' ? body.slice(0, 500) : body);
  }

  async function logResponse(response, label) {
    var text = await response.text();
    console.log('[GistSync] ' + label + ' 响应状态:', response.status, response.statusText);
    console.log('  响应体:', text.slice(0, 1000));
    // 尝试 parse JSON，返回解析结果
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  // 保存数据到 Gist（创建或更新）
  async function saveToGist(data) {
    var token = getToken();
    if (!token) return false;

    var content = JSON.stringify(data, null, 2);
    var gistId = getGistId();

    if (gistId) {
      // 更新已有 Gist
      var updateUrl = 'https://api.github.com/gists/' + gistId;
      var updateBody = JSON.stringify({
        files: {
          [GIST_FILENAME]: { content: content }
        }
      });
      debugLog('更新 Gist', updateUrl, {
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
      }, updateBody);

      var response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: updateBody
      });

      var result = await logResponse(response, '更新 Gist');
      if (response.status === 404) {
        setGistId('');
        return saveToGist(data);
      }
      if (!response.ok) {
        throw new Error('更新 Gist 失败: ' + response.status + ' ' + JSON.stringify(result));
      }
      return true;
    } else {
      // 创建新 Gist（直接包含文件内容，不用空 files {}）
      var createUrl = 'https://api.github.com/gists';
      var createBody = JSON.stringify({
        description: '历史人物地理志 - Historical Figure Map Data',
        public: false,
        files: {}
      });
      // 修正：直接传文件内容
      createBody = JSON.stringify({
        description: '历史人物地理志 - Historical Figure Map Data',
        public: false,
        files: {
          [GIST_FILENAME]: { content: content }
        }
      });

      debugLog('创建 Gist', createUrl, {
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
      }, createBody);

      var response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: createBody
      });

      var result = await logResponse(response, '创建 Gist');
      if (!response.ok) {
        throw new Error('创建 Gist 失败: ' + response.status + ' ' + JSON.stringify(result));
      }
      setGistId(result.id);
      return true;
    }
  }

  // 验证 Token 有效性（通过列出 Gist 或读取用户信息）
  async function validateToken(token) {
    var response = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': 'token ' + token }
    });
    if (!response.ok) return null;
    var data = await response.json();
    return data.login || null;
  }

  return {
    getToken: getToken,
    setToken: setToken,
    getGistId: getGistId,
    clearConfig: clearConfig,
    isConfigured: isConfigured,
    fetchFromGist: fetchFromGist,
    saveToGist: saveToGist,
    validateToken: validateToken
  };
})();
