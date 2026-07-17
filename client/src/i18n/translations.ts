export type Language = "zh" | "en" | "fr";

export interface Translations {
  [key: string]: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    // Menu
    "menu.title": "终极井字棋",
    "menu.mission": "任务简介",
    "menu.missionText": "赢得 3 个子棋盘即可宣布胜利。你的移动决定对手必须进攻的下一个子棋盘。",
    "menu.goldBorder": "金色边框标记活跃区域。",
    "menu.2players": "2 个玩家",
    "menu.vsAI": "vs AI",
    "menu.online": "联机",

    // Difficulty
    "difficulty.title": "选择难度",
    "difficulty.easy": "简单",
    "difficulty.medium": "中等",
    "difficulty.hard": "困难",

    // Online
    "online.title": "联机对战",
    "online.createRoom": "创建房间",
    "online.joinRoom": "加入房间",
    "online.roomCode": "房间号码",
    "online.enterCode": "输入房间号码",
    "online.join": "加入",
    "online.create": "创建",
    "online.back": "返回",
    "online.shareLink": "分享链接",
    "online.copyLink": "复制链接",
    "online.roomCreated": "房间已创建",
    "online.waitingForOpponent": "等待对手加入...",
    "online.opponentJoined": "对手已加入！",
    "online.invalidCode": "无效的房间号码",
    "online.roomNotFound": "房间不存在",

    // Game
    "game.you": "你",
    "game.playerX": "玩家 X",
    "game.playerO": "玩家 O",
    "game.ai": "AI",
    "game.yourTurn": "你的回合",
    "game.opponentTurn": "对手回合",
    "game.thinking": "思考中...",
    "game.gameOver": "游戏结束",
    "game.youWin": "你赢了",
    "game.playerXWins": "玩家 X 赢了",
    "game.playerOWins": "玩家 O 赢了",
    "game.aiWins": "AI 赢了",
    "game.draw": "平局",
    "game.playAgain": "再玩一次",
    "game.menu": "返回菜单",

    // Settings
    "settings.language": "语言",
  },
  en: {
    // Menu
    "menu.title": "ULTIMATE TIC TAC TOE",
    "menu.mission": "MISSION BRIEF",
    "menu.missionText": "Win 3 sub-boards in a row to claim victory. Your move determines which sub-board your opponent must attack next.",
    "menu.goldBorder": "Gold border marks the active zone.",
    "menu.2players": "2 PLAYERS",
    "menu.vsAI": "VS AI",
    "menu.online": "ONLINE",

    // Difficulty
    "difficulty.title": "SELECT DIFFICULTY",
    "difficulty.easy": "EASY",
    "difficulty.medium": "MEDIUM",
    "difficulty.hard": "HARD",

    // Online
    "online.title": "ONLINE BATTLE",
    "online.createRoom": "CREATE ROOM",
    "online.joinRoom": "JOIN ROOM",
    "online.roomCode": "ROOM CODE",
    "online.enterCode": "ENTER ROOM CODE",
    "online.join": "JOIN",
    "online.create": "CREATE",
    "online.back": "BACK",
    "online.shareLink": "SHARE LINK",
    "online.copyLink": "COPY LINK",
    "online.roomCreated": "ROOM CREATED",
    "online.waitingForOpponent": "WAITING FOR OPPONENT...",
    "online.opponentJoined": "OPPONENT JOINED!",
    "online.invalidCode": "INVALID ROOM CODE",
    "online.roomNotFound": "ROOM NOT FOUND",

    // Game
    "game.you": "YOU",
    "game.playerX": "PLAYER X",
    "game.playerO": "PLAYER O",
    "game.ai": "AI",
    "game.yourTurn": "YOUR TURN",
    "game.opponentTurn": "OPPONENT TURN",
    "game.thinking": "THINKING...",
    "game.gameOver": "GAME OVER",
    "game.youWin": "YOU WIN",
    "game.playerXWins": "PLAYER X WINS",
    "game.playerOWins": "PLAYER O WINS",
    "game.aiWins": "AI WINS",
    "game.draw": "DRAW",
    "game.playAgain": "PLAY AGAIN",
    "game.menu": "BACK TO MENU",

    // Settings
    "settings.language": "LANGUAGE",
  },
  fr: {
    // Menu
    "menu.title": "ULTIMATE TIC TAC TOE",
    "menu.mission": "BRIEFING",
    "menu.missionText": "Gagnez 3 sous-grilles d'affilée pour remporter la victoire. Votre coup détermine la sous-grille que votre adversaire doit attaquer ensuite.",
    "menu.goldBorder": "La bordure dorée marque la zone active.",
    "menu.2players": "2 JOUEURS",
    "menu.vsAI": "VS IA",
    "menu.online": "EN LIGNE",

    // Difficulty
    "difficulty.title": "SÉLECTIONNER DIFFICULTÉ",
    "difficulty.easy": "FACILE",
    "difficulty.medium": "MOYEN",
    "difficulty.hard": "DIFFICILE",

    // Online
    "online.title": "BATAILLE EN LIGNE",
    "online.createRoom": "CRÉER SALLE",
    "online.joinRoom": "REJOINDRE SALLE",
    "online.roomCode": "CODE SALLE",
    "online.enterCode": "ENTRER CODE SALLE",
    "online.join": "REJOINDRE",
    "online.create": "CRÉER",
    "online.back": "RETOUR",
    "online.shareLink": "PARTAGER LIEN",
    "online.copyLink": "COPIER LIEN",
    "online.roomCreated": "SALLE CRÉÉE",
    "online.waitingForOpponent": "EN ATTENTE D'ADVERSAIRE...",
    "online.opponentJoined": "ADVERSAIRE A REJOINT!",
    "online.invalidCode": "CODE SALLE INVALIDE",
    "online.roomNotFound": "SALLE NON TROUVÉE",

    // Game
    "game.you": "VOUS",
    "game.playerX": "JOUEUR X",
    "game.playerO": "JOUEUR O",
    "game.ai": "IA",
    "game.yourTurn": "VOTRE TOUR",
    "game.opponentTurn": "TOUR ADVERSAIRE",
    "game.thinking": "RÉFLEXION...",
    "game.gameOver": "FIN DU JEU",
    "game.youWin": "VOUS AVEZ GAGNÉ",
    "game.playerXWins": "JOUEUR X A GAGNÉ",
    "game.playerOWins": "JOUEUR O A GAGNÉ",
    "game.aiWins": "L'IA A GAGNÉ",
    "game.draw": "ÉGALITÉ",
    "game.playAgain": "REJOUER",
    "game.menu": "RETOUR AU MENU",

    // Settings
    "settings.language": "LANGUE",
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang][key] || key;
}
