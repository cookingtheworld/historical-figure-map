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

  // 保存数据到 Gist（创建或更新）
  async function saveToGist(data) {
    var token = getToken();
    if (!token) return false;

    var content = JSON.stringify(data, null, 2);
    var gistId = getGistId();

    if (gistId) {
      // 更新已有 Gist
      var response = await fetch('https://api.github.com/gists/' + gistId, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {}
        })
      });
      if (!response.ok) {
        if (response.status === 404) {
          setGistId('');
          return saveToGist(data);
        }
        throw new Error('更新 Gist 失败: ' + response.status);
      }

      // GitHub Gist API: 必须先清空再写入，否则旧内容残留
      // 实际上 PATCH 时直接传新内容会覆盖，不需要先清空
      response = await fetch('https://api.github.com/gists/' + gistId, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: { content: content }
          }
        })
      });
      return response.ok;
    } else {
      // 创建新 Gist
      var response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: '历史人物地理志 - Historical Figure Map Data',
          public: false,
          files: {}
        })
      });
      if (!response.ok) throw new Error('创建 Gist 失败: ' + response.status);
      var result = await response.json();

      // 创建后立即用新内容更新
      response = await fetch('https://api.github.com/gists/' + result.id, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: { content: content }
          }
        })
      });
      if (response.ok) {
        setGistId(result.id);
        return true;
      }
      return false;
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
