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
    "difficulty.chooseDesc": "选择AI对手强度",
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
    "online.shareCodeDesc": "将此代码分享给对手",
    "online.cancel": "取消",
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
    "game.newGame": "新游戏",
    "game.turn": "回合",
    "game.yourMove": "你的回合",
    "game.aiMove": "AI 回合",
    "game.playerTurn": "玩家 {player}",
    "game.clickToContinue": "点击任意处继续",

    // HUD
    "hud.goldBorder": "金色边框 = 活跃棋盘",
    "hud.sendOpponent": "落子决定对手位置",

    // Brand
    "brand.footer": "终极井字棋 · 霓虹网格指挥",

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
    "difficulty.chooseDesc": "Choose your AI opponent strength",
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
    "online.shareCodeDesc": "Share this code with your opponent",
    "online.cancel": "CANCEL",
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
    "game.newGame": "NEW GAME",
    "game.turn": "TURN",
    "game.yourMove": "YOUR MOVE",
    "game.aiMove": "AI MOVE",
    "game.playerTurn": "PLAYER {player}",
    "game.clickToContinue": "CLICK ANYWHERE TO CONTINUE",

    // HUD
    "hud.goldBorder": "GOLD BORDER = ACTIVE BOARD",
    "hud.sendOpponent": "PLAY IN A CELL → SEND OPPONENT THERE",

    // Brand
    "brand.footer": "ULTIMATE TIC TAC TOE · NEON GRID COMMAND",

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
    "difficulty.chooseDesc": "Choisissez la force de l'IA adverse",
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
    "online.shareCodeDesc": "Partagez ce code avec votre adversaire",
    "online.cancel": "ANNULER",
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
    "game.newGame": "NOUVELLE PARTIE",
    "game.turn": "TOUR",
    "game.yourMove": "VOTRE COUP",
    "game.aiMove": "COUP DE L'IA",
    "game.playerTurn": "JOUEUR {player}",
    "game.clickToContinue": "CLIQUEZ N'IMPORTE OÙ POUR CONTINUER",

    // HUD
    "hud.goldBorder": "BORDURE DORÉE = PLATEAU ACTIF",
    "hud.sendOpponent": "JOUEZ DANS UNE CASE → ENVOYEZ L'ADVERSAIRE",

    // Brand
    "brand.footer": "ULTIMATE TIC TAC TOE · COMMANDE GRILLE NÉON",

    // Settings
    "settings.language": "LANGUE",
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang][key] || key;
}
