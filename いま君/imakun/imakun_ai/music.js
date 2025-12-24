/* --------------------------------------------------------------------------------- */
/* 2. 感情・色判定ロジック                                                            */
/* --------------------------------------------------------------------------------- */
/* ====================================================================
   YouTube IFrame Player API 統合コード
   ==================================================================== */

// 音楽再生機能のフラグ
let isMusicPlayerEnabled = true; 

/* --- 1. グローバル変数と IFrame API ローダー --- */

// プレイヤーオブジェクトを保持するためのグローバル変数
let player = null; 
// プレイリストIDを一時的に保持する変数
let currentPlaylistId = null;
// API準備完了を待つロードリクエストを一時的に保持するキュー
let playerLoadQueue = []; 

// YouTube IFrame Player API スクリプトを非同期でロード
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/**
 * (2) API準備完了時に自動的に実行される関数 (YT.Playerの定義に必須)
 */
function onYouTubeIframeAPIReady() {
    console.log("YouTube IFrame API Ready. 待機中のロードリクエストを処理します。");
    // キューに溜まっていたリクエストを処理
    while (playerLoadQueue.length > 0) {
        // キューからクエリを取り出し、キューからの実行フラグ(true)を付けて loadYouTubePlayer を呼び出す
        const query = playerLoadQueue.shift(); 
        loadYouTubePlayer(query, true); 
    }
}

/* --- 2. loadYouTubePlayer 関数の修正 (API統合) --- */

/* --- 2. プレイリストマッピング --- */
const emotionPlaylistMap = {
    SuperHappy: 'PLxJi-_YDGYiBY8BciT-2iE9Qg2hUbJGeU',
    Rage: 'PLTL76Jp3n2wFV6N5Y1z9-Z5t8R-v1y1a1',
    Anger: 'PLTL76Jp3n2wFV6N5Y1z9-Z5t8R-v1y1a1',
    Sadness: 'PLTL76Jp3n2wF-t6l-2V7s2-g5V-8K_4S2',
    Negative: 'PLTL76Jp3n2wF-t6l-2V7s2-g5V-8K_4S2',
    Positive: 'PLTL76Jp3n2wE1D94i8-j3y0X4k_1I0X4k',
    Default: 'PLTL76Jp3n2wF-t6l-2V7s2-g5V-8K_4S2'
};
/**
 * 独自のYouTube埋め込みプレイヤーをロード・再生する関数
 * YT.Player APIを使用してプレイヤーを生成し、準備完了後に再生を試みる。
 * @param {string} query 再生する曲のクエリ (例: "元気が出るアップテンポ")
 * @param {boolean} [fromQueue=false] キューから実行されたかどうか
 */
/* --- 3. YouTubeプレイヤー生成・再生 --- */
function loadYouTubePlayer(query, fromQueue = false) {
    const container = document.getElementById("musicPlayerContainer");
    if (!container) return console.error("musicPlayerContainerが存在しません");

    // query → emotion → playlistId
    let emotion = query; // デフォルトはqueryをそのまま使う
    if (!emotionPlaylistMap[emotion]) emotion = 'Default';
    const playlistId = emotionPlaylistMap[emotion];
    currentPlaylistId = playlistId;

    // プレイヤー未生成の場合
    if (!player || typeof YT === 'undefined' || !YT.Player) {
        if (!fromQueue) {
            playerLoadQueue.push(query);
            return console.warn("YT.Player未準備。キューに追加");
        }
        return console.error("キューから呼ばれたがYT.Player未準備");
    }

    // 既存プレイヤーがある場合
    if (player && player.loadPlaylist) {
        player.loadPlaylist({ list: playlistId, listType: 'playlist' });
        try { player.playVideo(); } catch {}
        container.style.opacity = 1;
        console.log(`[YouTube] 既存プレイヤーにプレイリスト ${playlistId} をロード`);
        return;
    }

    // 新規プレイヤー作成
    player = new YT.Player('musicPlayerContainer', {
        playerVars: {
            listType: 'playlist',
            list: playlistId,
            autoplay: 1,
            enablejsapi: 1,
            controls: 0,
            mute: 0
        },
        events: {
            onReady: (event) => {
                event.target.playVideo();
                container.style.opacity = 1;
                console.log("[YouTube] プレイヤー準備完了、再生開始");
            }
        }
    });
}    
    

/* --- 3. playEmotionMusic 関数 (音楽再生のトリガー) --- */
/**
 * AIの感情に対応した音楽をYouTube Musicで再生する
 * @param {string} emotion 感情の種別 ('Rage', 'Positive' など)
 * @param {string} text AIの応答テキスト
 */
function playEmotionMusic(emotion, text) {
    if (!isMusicPlayerEnabled) return stopEmotionMusic();
    if (!emotionPlaylistMap[emotion]) emotion = 'Default';
        console.log("ミュージックプレイヤー機能が無効のため、再生をスキップします。");
    
    let query = '';
    
    switch (emotion) {
        case 'Rage':
            query = `本気の怒りや絶望のロック`;
            break;
        case 'SuperHappy':
            query = `最高にハッピーなポップヒット`;
            break;
        case 'Anger':
            query = `激しいロックや怒りを鎮めるクラシック`;
            break;
        case 'Sadness':
            query = `心が癒されるバラード`;
            break;
        case 'Negative':
            query = `落ち着くアンビエント`;
            break;
        case 'Positive':
            query = `元気が出るアップテンポ`;
            break;
        default:
            query = `穏やかなリラックスミュージック`;
            break;
    }
    // 音楽再生を開始
    console.log(`[${emotion}] の感情に基づいて、YouTube Musicプレイヤーサーバーへの「${query}」の再生をリクエストをロードします。`);  
    loadYouTubePlayer(query);

}
/* --- 4. stopEmotionMusic 関数の修正 (API対応) --- */
/**
 * 音楽を停止する (API経由で停止し、プレイヤーをクリアする)
 */
function stopEmotionMusic() {
    const container = document.getElementById("musicPlayerContainer");

    if (player && player.stopVideo) {
        // プレイヤーが存在する場合、API経由で停止と破棄を行う
        try {
            player.stopVideo();
            player.destroy(); // プレイヤーインスタンスを破棄してメモリを解放
            player = null; // グローバル変数をクリア
            console.log("YouTube API経由で再生を停止し、プレイヤーを破棄しました。");
        } catch (e) {
             console.error("プレイヤーの停止/破棄中にエラー:", e);
        }
    }
    
    // DOM要素をクリアし、非表示にする (APIが利用できない場合も実行)
    if (container) {
        container.innerHTML = '';
        container.style.opacity = 0; // プレイヤーを非表示に戻す
    }
    
    // キューもクリア
    playerLoadQueue = [];
    currentPlaylistId = null;
    console.log("未処理の音楽ロードキューをクリアしました。");
}
/**
 * AIの回答テキストに基づいて波形の色を変更する関数
 * @param {string} responseText LLMからの回答テキスト
 */
/* --- 6. 波形色設定と感情連動 --- */
function setWaveColorBasedOnResponse(responseText) {
    const text = responseText.toLowerCase();
    const extractEmojis = t => (t.match(/\p{Emoji_Presentation}|\p{Emoji}\p{Emoji_Modifier}*|\p{Emoji_Component}|\u200d/gu) || []).join('');

    const emotionMap = [
        { name:'Rage', keywords:['裏切り','絶交','失望'], emojis:['😡','😠','🤬'], color: WAVE_COLORS.rage },
        { name:'SuperHappy', keywords:['最高にハッピー','奇跡','完璧'], emojis:['🤩','✨','🥳'], color:'rainbow' },
        { name:'Anger', keywords:['怒り','ふざけるな'], emojis:['😤','💢'], color: WAVE_COLORS.anger },
        { name:'Sadness', keywords:['悲しい','泣く','つらい'], emojis:['😭','😢'], color: WAVE_COLORS.sadness },
        { name:'Negative', keywords:['失敗','無理','難しい'], emojis:['😞','😟'], color: WAVE_COLORS.negative },
        { name:'Positive', keywords:['ありがとう','成功','良い','ハッピー'], emojis:['😄','😊','😆'], color: WAVE_COLORS.positive }
    ];

    for (const e of emotionMap) {
        if (e.keywords.some(k => text.includes(k)) || e.emojis.some(em => text.includes(em))) {
            currentWaveColor = e.color;
            console.log(`[Wave] 色を${e.name}に設定`);
            if (isMusicPlayerEnabled) playEmotionMusic(e.name);
            return;
        }
    }
    // デフォルト
    currentWaveColor = WAVE_COLORS.default;
    console.log("[Wave] デフォルト色に設定");
    if (isMusicPlayerEnabled) playEmotionMusic('Default');
}
/* JavaScriptファイル内の適切な位置に追加 */
/* --- 7. ミュージックトグル --- */
document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('music-toggle-checkbox'); 
    musicToggle.checked = isMusicPlayerEnabled; 
    musicToggle.addEventListener('change', toggleMusicPlayer);
});
/**
 * 音楽再生機能のON/OFFを切り替える (既存の関数)
 */
function toggleMusicPlayer() {
    // グローバル変数 isMusicPlayerEnabled を反転
    isMusicPlayerEnabled = !isMusicPlayerEnabled;   
    // UIのフィードバック (必要に応じて)
    if (isMusicPlayerEnabled) {
        updateStatus('ミュージックプレイヤー: ON 🎶', WAVE_COLORS.positive);
    } else {
        stopEmotionMusic(); 
        updateStatus('ミュージックプレイヤー: OFF 🔇', WAVE_COLORS.negative);
    }
}