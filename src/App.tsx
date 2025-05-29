import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ========== 类型定义 ==========
interface GameState {
  currentPage: string;
  players: Record<string, Player>;
  currentPlayer: string | null;
  gameWinner: string | null;
  gameStartTime: number;
  gameEndTime: number | null;
  soundEnabled: boolean;
  gameSettings: GameSettings;
  gameMode: 'setup' | 'playing' | 'finished';
  roomId: string;
  winnerTime: number | null;
}

interface GameSettings {
  maxActionChances: number;
  templeRequiredCoins: number;
  templeRequiredShells: number;
  timeLimit: number;
}

interface Player {
  id: string;
  name: string;
  color: string;
  coins: number;
  shells: number;
  completedZones: string[];
  actionChances: number;
  log: GameLog[];
  achievements: string[];
  totalScore: number;
  lastActive: number;
  isWinner: boolean;
  winTime: number | null;
  collectedCards: CollectedCard[];
}

interface GameLog {
  type: string;
  zone: string;
  result: string;
  reward: number;
  timestamp: number;
  description: string;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CollectedCard {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  type: string;
  amount: number;
  timestamp: number;
}

// ========== 游戏数据 ==========
const GAME_SETTINGS: GameSettings = {
  maxActionChances: 5,
  templeRequiredCoins: 10,
  templeRequiredShells: 3,
  timeLimit: 30
};

const PLAYER_COLORS = [
  { id: 'blue', name: '蓝海龟', bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', text: 'text-blue-600' },
  { id: 'green', name: '绿海龟', bg: 'bg-green-500', gradient: 'from-green-400 to-green-600', text: 'text-green-600' },
  { id: 'red', name: '红海龟', bg: 'bg-red-500', gradient: 'from-red-400 to-red-600', text: 'text-red-600' },
  { id: 'purple', name: '紫海龟', bg: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600', text: 'text-purple-600' },
  { id: 'orange', name: '橙海龟', bg: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600', text: 'text-orange-600' },
  { id: 'pink', name: '粉海龟', bg: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600', text: 'text-pink-600' },
  { id: 'teal', name: '青海龟', bg: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600', text: 'text-teal-600' },
  { id: 'indigo', name: '靛海龟', bg: 'bg-indigo-500', gradient: 'from-indigo-400 to-indigo-600', text: 'text-indigo-600' },
  { id: 'yellow', name: '黄海龟', bg: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600', text: 'text-yellow-600' },
  { id: 'lime', name: '青柠海龟', bg: 'bg-lime-500', gradient: 'from-lime-400 to-lime-600', text: 'text-lime-600' },
  { id: 'cyan', name: '青蓝海龟', bg: 'bg-cyan-500', gradient: 'from-cyan-400 to-cyan-600', text: 'text-cyan-600' },
  { id: 'amber', name: '琥珀海龟', bg: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600', text: 'text-amber-600' },
  { id: 'emerald', name: '翡翠海龟', bg: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600', text: 'text-emerald-600' },
  { id: 'rose', name: '玫瑰海龟', bg: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600', text: 'text-rose-600' },
  { id: 'violet', name: '紫罗兰海龟', bg: 'bg-violet-500', gradient: 'from-violet-400 to-violet-600', text: 'text-violet-600' }
];

const ZONES = [
  { 
    id: 'coral', 
    name: '珊瑚礁花园', 
    emoji: '🪸', 
    x: 25, 
    y: 35,
    description: '五彩斑斓的珊瑚礁，海洋生物的天堂',
    bgColor: 'from-pink-400 to-rose-500'
  },
  { 
    id: 'cave', 
    name: '神秘海洞', 
    emoji: '🕳️', 
    x: 75, 
    y: 25,
    description: '深邃的海底洞穴，藏着古老的秘密',
    bgColor: 'from-slate-600 to-gray-700'
  },
  { 
    id: 'kelp', 
    name: '海藻迷宫', 
    emoji: '🌿', 
    x: 20, 
    y: 75,
    description: '茂密的海藻森林，考验你的智慧',
    bgColor: 'from-green-400 to-emerald-500'
  },
  { 
    id: 'shipwreck', 
    name: '沉船宝藏', 
    emoji: '🚢', 
    x: 80, 
    y: 70,
    description: '古老的沉船遗址，满载珍贵宝藏',
    bgColor: 'from-amber-500 to-orange-600'
  },
  { 
    id: 'volcano', 
    name: '火山温泉', 
    emoji: '🌋', 
    x: 50, 
    y: 50,
    description: '海底火山口，温暖的治愈之地',
    bgColor: 'from-red-500 to-orange-500'
  }
];

// 50个海洋知识问题
const QUESTIONS: Record<string, Question[]> = {
  coral: [
    {
      question: "珊瑚礁是由什么生物形成的？",
      options: ["珊瑚虫", "海藻", "贝类", "鱼类"],
      answer: 0,
      explanation: "珊瑚礁是由无数微小的珊瑚虫经过漫长时间堆积形成的！",
      difficulty: 'easy'
    },
    {
      question: "大堡礁位于哪个国家？",
      options: ["菲律宾", "澳大利亚", "印度尼西亚", "马来西亚"],
      answer: 1,
      explanation: "澳大利亚的大堡礁是世界上最大的珊瑚礁系统！",
      difficulty: 'medium'
    },
    {
      question: "珊瑚的颜色主要来源于什么？",
      options: ["珊瑚本身", "共生藻类", "海水反射", "阳光照射"],
      answer: 1,
      explanation: "珊瑚的美丽颜色主要来自与其共生的虫黄藻！",
      difficulty: 'hard'
    },
    {
      question: "珊瑚是植物还是动物？",
      options: ["植物", "动物", "真菌", "细菌"],
      answer: 1,
      explanation: "珊瑚虽然看起来像植物，但实际上是动物！",
      difficulty: 'easy'
    },
    {
      question: "珊瑚白化是什么原因造成的？",
      options: ["水温升高", "营养过多", "光照不足", "盐分变化"],
      answer: 0,
      explanation: "海水温度升高会导致珊瑚排出共生藻类，造成白化现象。",
      difficulty: 'hard'
    },
    {
      question: "小丑鱼和海葵的关系是什么？",
      options: ["竞争关系", "捕食关系", "共生关系", "无关系"],
      answer: 2,
      explanation: "小丑鱼和海葵是互利共生关系，相互保护和提供营养。",
      difficulty: 'medium'
    },
    {
      question: "珊瑚礁主要分布在什么海域？",
      options: ["寒带海域", "温带海域", "热带海域", "极地海域"],
      answer: 2,
      explanation: "珊瑚礁主要分布在热带和亚热带的温暖海域中。",
      difficulty: 'easy'
    },
    {
      question: "世界上最大的珊瑚礁系统有多长？",
      options: ["1000公里", "2300公里", "3500公里", "5000公里"],
      answer: 1,
      explanation: "澳大利亚大堡礁长约2300公里，是世界上最大的珊瑚礁系统。",
      difficulty: 'medium'
    },
    {
      question: "珊瑚礁为什么被称为海洋中的热带雨林？",
      options: ["颜色丰富", "生物多样性高", "结构复杂", "以上都是"],
      answer: 3,
      explanation: "珊瑚礁拥有极高的生物多样性、复杂的结构和丰富的色彩，就像海洋中的热带雨林。",
      difficulty: 'medium'
    },
    {
      question: "珊瑚虫的主要食物是什么？",
      options: ["海藻", "浮游生物", "小鱼", "贝类"],
      answer: 1,
      explanation: "珊瑚虫主要以浮游生物为食，同时也依靠体内共生藻类的光合作用。",
      difficulty: 'hard'
    }
  ],
  cave: [
    {
      question: "海洋中最深的地方叫什么？",
      options: ["马里亚纳海沟", "大西洋海沟", "太平洋深渊", "印度洋谷"],
      answer: 0,
      explanation: "马里亚纳海沟是地球上已知的最深海沟！",
      difficulty: 'medium'
    },
    {
      question: "深海中没有阳光，生物如何获得能量？",
      options: ["光合作用", "化能合成", "寄生其他生物", "冬眠"],
      answer: 1,
      explanation: "深海生物通过化能合成，利用化学反应获得能量。",
      difficulty: 'hard'
    },
    {
      question: "深海鱼类通常有什么特征？",
      options: ["色彩鲜艳", "眼睛很大", "游泳很快", "体型很小"],
      answer: 1,
      explanation: "深海鱼类通常有很大的眼睛来捕捉微弱的光线！",
      difficulty: 'easy'
    },
    {
      question: "马里亚纳海沟的最深处叫什么？",
      options: ["挑战者深渊", "探索者深渊", "发现者深渊", "先锋者深渊"],
      answer: 0,
      explanation: "马里亚纳海沟的最深处被称为挑战者深渊，深度超过11000米。",
      difficulty: 'hard'
    },
    {
      question: "深海热泉附近为什么会有丰富的生物？",
      options: ["温度适宜", "营养丰富", "化学能量", "以上都是"],
      answer: 3,
      explanation: "深海热泉提供温暖的环境、丰富的矿物质和化学能量，形成独特的生态系统。",
      difficulty: 'medium'
    },
    {
      question: "深海巨型鱿鱼的天敌是什么？",
      options: ["抹香鲸", "虎鲸", "大白鲨", "蓝鲸"],
      answer: 0,
      explanation: "抹香鲸是深海巨型鱿鱼的主要天敌，它们可以潜入深海捕食。",
      difficulty: 'medium'
    },
    {
      question: "深海压力有多大？",
      options: ["比海面高10倍", "比海面高100倍", "比海面高1000倍", "比海面高10000倍"],
      answer: 2,
      explanation: "在深海11000米处，压力比海面高约1100倍，相当于1000个大气压。",
      difficulty: 'hard'
    },
    {
      question: "深海中的发光现象叫什么？",
      options: ["磷光", "荧光", "生物发光", "化学发光"],
      answer: 2,
      explanation: "深海生物通过体内的生物化学反应产生光，这种现象叫生物发光。",
      difficulty: 'medium'
    },
    {
      question: "第一次载人深潜到马里亚纳海沟是在哪一年？",
      options: ["1950年", "1960年", "1970年", "1980年"],
      answer: 1,
      explanation: "1960年，科学家首次乘坐深海潜水器成功下潜到马里亚纳海沟底部。",
      difficulty: 'hard'
    },
    {
      question: "深海鮟鱇鱼的发光器官有什么作用？",
      options: ["照明", "求偶", "捕食", "以上都是"],
      answer: 3,
      explanation: "深海鮟鱇鱼的发光器官可以用来照明、吸引猎物和求偶交配。",
      difficulty: 'easy'
    }
  ],
  kelp: [
    {
      question: "海藻通过什么过程产生氧气？",
      options: ["呼吸作用", "光合作用", "消化作用", "分解作用"],
      answer: 1,
      explanation: "海藻和陆地植物一样，通过光合作用产生氧气！",
      difficulty: 'easy'
    },
    {
      question: "海带属于什么类型的生物？",
      options: ["植物", "动物", "真菌", "藻类"],
      answer: 3,
      explanation: "海带实际上是大型藻类，不是真正的植物哦！",
      difficulty: 'medium'
    },
    {
      question: "海藻森林主要分布在什么海域？",
      options: ["热带海域", "温带海域", "极地海域", "所有海域"],
      answer: 1,
      explanation: "大型海藻森林主要分布在温带海域，那里的环境最适合它们生长！",
      difficulty: 'hard'
    },
    {
      question: "世界上最大的海藻是什么？",
      options: ["紫菜", "海带", "巨藻", "裙带菜"],
      answer: 2,
      explanation: "巨藻是世界上最大的海藻，可以长达60米以上。",
      difficulty: 'medium'
    },
    {
      question: "海藻的主要营养价值是什么？",
      options: ["蛋白质", "碳水化合物", "碘元素", "维生素C"],
      answer: 2,
      explanation: "海藻富含碘元素，对人体甲状腺功能很重要。",
      difficulty: 'easy'
    },
    {
      question: "海藻森林为海洋生物提供什么？",
      options: ["食物", "栖息地", "保护", "以上都是"],
      answer: 3,
      explanation: "海藻森林为海洋生物提供食物来源、栖息地和保护场所。",
      difficulty: 'easy'
    },
    {
      question: "海藻是如何固定在海底的？",
      options: ["根系", "固着器", "吸盘", "胶质"],
      answer: 1,
      explanation: "海藻通过固着器（类似根部的结构）固定在海底岩石上。",
      difficulty: 'medium'
    },
    {
      question: "海藻一天能生长多少？",
      options: ["几毫米", "几厘米", "几十厘米", "几米"],
      answer: 2,
      explanation: "某些大型海藻如巨藻一天可以生长几十厘米，是生长最快的植物之一。",
      difficulty: 'hard'
    },
    {
      question: "海藻的繁殖方式有哪些？",
      options: ["无性繁殖", "有性繁殖", "孢子繁殖", "以上都是"],
      answer: 3,
      explanation: "海藻具有多种繁殖方式，包括无性繁殖、有性繁殖和孢子繁殖。",
      difficulty: 'medium'
    },
    {
      question: "为什么海藻大多呈现绿色或褐色？",
      options: ["叶绿素", "类胡萝卜素", "藻胆蛋白", "以上都是"],
      answer: 3,
      explanation: "海藻含有多种色素，包括叶绿素、类胡萝卜素和藻胆蛋白等。",
      difficulty: 'hard'
    }
  ],
  shipwreck: [
    {
      question: "海龟可以在水下憋气多长时间？",
      options: ["5分钟", "30分钟", "2小时", "5小时"],
      answer: 2,
      explanation: "海龟是憋气高手，可以在水下憋气2小时甚至更长！",
      difficulty: 'medium'
    },
    {
      question: "海龟的壳由什么组成？",
      options: ["纯骨头", "软骨", "骨头和角质", "钙质"],
      answer: 2,
      explanation: "海龟的壳由骨头结构和表面的角质鳞片组成。",
      difficulty: 'hard'
    },
    {
      question: "海龟主要以什么为食？",
      options: ["鱼类", "海草和水母", "贝类", "珊瑚"],
      answer: 1,
      explanation: "不同种类的海龟食性不同，但主要以海草、水母等为食！",
      difficulty: 'easy'
    },
    {
      question: "海龟是如何导航的？",
      options: ["太阳", "星星", "地磁场", "以上都是"],
      answer: 3,
      explanation: "海龟具有多种导航能力，包括利用太阳、星星和地球磁场进行导航。",
      difficulty: 'hard'
    },
    {
      question: "海龟的寿命一般有多长？",
      options: ["20-30年", "50-80年", "100-150年", "200年以上"],
      answer: 2,
      explanation: "海龟是长寿动物，许多种类可以活100-150年。",
      difficulty: 'medium'
    },
    {
      question: "雌海龟产卵时会选择什么地方？",
      options: ["任意海滩", "出生的海滩", "最近的海滩", "最安全的海滩"],
      answer: 1,
      explanation: "雌海龟具有归巢本能，会回到自己出生的海滩产卵。",
      difficulty: 'medium'
    },
    {
      question: "海龟蛋的孵化温度决定什么？",
      options: ["孵化时间", "幼龟大小", "幼龟性别", "孵化成功率"],
      answer: 2,
      explanation: "海龟蛋的孵化温度决定幼龟的性别，温度高产雌性，温度低产雄性。",
      difficulty: 'hard'
    },
    {
      question: "世界上最大的海龟是什么？",
      options: ["绿海龟", "玳瑁", "棱皮龟", "蠵龟"],
      answer: 2,
      explanation: "棱皮龟是世界上最大的海龟，重量可达900公斤。",
      difficulty: 'medium'
    },
    {
      question: "海龟为什么会误食塑料垃圾？",
      options: ["饥饿", "好奇", "误认为是水母", "习惯"],
      answer: 2,
      explanation: "海龟经常误认为塑料袋是水母而误食，对它们造成严重伤害。",
      difficulty: 'easy'
    },
    {
      question: "海龟从什么时期就存在了？",
      options: ["1亿年前", "2亿年前", "3亿年前", "5亿年前"],
      answer: 1,
      explanation: "海龟是古老的物种，从约2亿年前就已经存在了。",
      difficulty: 'hard'
    }
  ],
  volcano: [
    {
      question: "海底火山喷发会形成什么？",
      options: ["新的岛屿", "海啸", "暖流", "以上都可能"],
      answer: 3,
      explanation: "海底火山喷发可能形成新岛屿、引发海啸或产生暖流！",
      difficulty: 'hard'
    },
    {
      question: "地球上有多少座活火山？",
      options: ["约500座", "约1500座", "约3000座", "约5000座"],
      answer: 1,
      explanation: "全球约有1500座活火山，其中很多位于海底。",
      difficulty: 'medium'
    },
    {
      question: "火山温泉的水温通常是多少？",
      options: ["20-30℃", "40-60℃", "70-90℃", "100℃以上"],
      answer: 2,
      explanation: "火山温泉的水温通常在70-90℃之间，含有丰富的矿物质！",
      difficulty: 'easy'
    },
    {
      question: "环太平洋火山带被称为什么？",
      options: ["火环", "火圈", "火山链", "火山带"],
      answer: 0,
      explanation: "环太平洋火山带被称为'火环'，集中了全球大部分的火山和地震。",
      difficulty: 'medium'
    },
    {
      question: "海底火山热泉的温度可以达到多高？",
      options: ["100℃", "200℃", "300℃", "400℃以上"],
      answer: 3,
      explanation: "海底火山热泉的温度可以超过400℃，是地球上最极端的环境之一。",
      difficulty: 'hard'
    },
    {
      question: "火山岩浆的主要成分是什么？",
      options: ["硅酸盐", "碳酸盐", "硫酸盐", "氯化物"],
      answer: 0,
      explanation: "火山岩浆主要由硅酸盐矿物组成，含有不同比例的硅、铝、铁、镁等元素。",
      difficulty: 'medium'
    },
    {
      question: "海底火山形成岛屿需要多长时间？",
      options: ["几年", "几十年", "几千年", "几万年"],
      answer: 3,
      explanation: "海底火山形成岛屿通常需要几万年甚至更长时间的持续喷发和堆积。",
      difficulty: 'hard'
    },
    {
      question: "夏威夷群岛是如何形成的？",
      options: ["板块碰撞", "海底扩张", "热点火山", "地壳断裂"],
      answer: 2,
      explanation: "夏威夷群岛是由热点火山活动形成的，随着太平洋板块的移动而形成岛链。",
      difficulty: 'hard'
    },
    {
      question: "火山喷发对海洋生物有什么影响？",
      options: ["都是有害的", "都是有益的", "既有害也有益", "没有影响"],
      answer: 2,
      explanation: "火山喷发对海洋生物既有害也有益，可能造成死亡但也会带来营养物质。",
      difficulty: 'medium'
    },
    {
      question: "世界上最活跃的海底火山在哪里？",
      options: ["大西洋", "太平洋", "印度洋", "北冰洋"],
      answer: 1,
      explanation: "太平洋拥有世界上最活跃的海底火山，特别是在环太平洋火山带。",
      difficulty: 'easy'
    }
  ]
};

const CARD_REWARDS = [
  // 普通卡牌
  { id: 'golden_shell', type: 'coins', amount: 3, name: '金贝壳', emoji: '💰', rarity: 'common' },
  { id: 'pearl_shell', type: 'shells', amount: 2, name: '珍珠贝', emoji: '🐚', rarity: 'common' },
  { id: 'small_coin', type: 'coins', amount: 1, name: '小金币', emoji: '🪙', rarity: 'common' },
  { id: 'basic_shell', type: 'shells', amount: 1, name: '普通贝壳', emoji: '🐚', rarity: 'common' },
  { id: 'dolphin_help', type: 'action', amount: 1, name: '海豚助力', emoji: '🐬', rarity: 'common' },
  { id: 'wave_splash', type: 'skip', amount: 0, name: '海浪冲击', emoji: '🌊', rarity: 'common' },
  { id: 'small_blessing', type: 'bonus', amount: 1, name: '小祝福', emoji: '⭐', rarity: 'common' },
  { id: 'starfish_gift', type: 'coins', amount: 2, name: '海星礼物', emoji: '⭐', rarity: 'common' },
  
  // 稀有卡牌
  { id: 'magic_conch', type: 'shells', amount: 3, name: '魔法海螺', emoji: '🐚', rarity: 'rare' },
  { id: 'turtle_blessing', type: 'bonus', amount: 2, name: '海龟祝福', emoji: '🐢', rarity: 'rare' },
  { id: 'crystal_coin', type: 'coins', amount: 4, name: '水晶币', emoji: '💎', rarity: 'rare' },
  { id: 'whale_song', type: 'action', amount: 2, name: '鲸鱼之歌', emoji: '🐋', rarity: 'rare' },
  { id: 'seahorse_luck', type: 'bonus', amount: 3, name: '海马幸运', emoji: '🐴', rarity: 'rare' },
  { id: 'jellyfish_dance', type: 'shells', amount: 4, name: '水母之舞', emoji: '🎐', rarity: 'rare' },
  
  // 史诗卡牌
  { id: 'pirate_treasure', type: 'coins', amount: 6, name: '海盗宝箱', emoji: '💎', rarity: 'epic' },
  { id: 'mermaid_tear', type: 'shells', amount: 5, name: '美人鱼之泪', emoji: '✨', rarity: 'epic' },
  { id: 'kraken_power', type: 'bonus', amount: 4, name: '海怪之力', emoji: '🦑', rarity: 'epic' },
  { id: 'coral_crown', type: 'coins', amount: 7, name: '珊瑚王冠', emoji: '👑', rarity: 'epic' },
  { id: 'ocean_heart', type: 'bonus', amount: 5, name: '海洋之心', emoji: '💙', rarity: 'epic' },
  
  // 传说卡牌
  { id: 'poseidon_trident', type: 'bonus', amount: 8, name: '海神三叉戟', emoji: '🔱', rarity: 'legendary' },
  { id: 'legendary_shell', type: 'shells', amount: 10, name: '传说贝壳', emoji: '✨', rarity: 'legendary' },
  { id: 'atlantis_coin', type: 'coins', amount: 12, name: '亚特兰蒂斯金币', emoji: '🏛️', rarity: 'legendary' },
  { id: 'leviathan_scale', type: 'action', amount: 5, name: '利维坦鳞片', emoji: '🐲', rarity: 'legendary' }
];

const TEMPLE_PUZZLES = [
  {
    question: "海龟妈妈回到出生地产卵的行为叫什么？",
    answers: ["回游", "洄游", "回归", "归巢", "回巢"],
    explanation: "海龟的回游本能让它们能够跨越千里回到出生地产卵！"
  },
  {
    question: "海龟蛋的孵化温度决定什么？",
    answers: ["性别", "雌雄", "公母", "男女"],
    explanation: "海龟蛋的孵化温度决定幼龟的性别，这是自然界的奇妙现象！"
  },
  {
    question: "海龟能活多少年？",
    answers: ["100年", "一百年", "超过100年", "100多年", "很久"],
    explanation: "海龟是长寿动物，许多种类可以活100年以上！"
  }
];

// ========== 音效系统 ==========
const SoundManager = {
  context: null as AudioContext | null,
  
  init() {
    if (!this.context && typeof window !== 'undefined') {
      try {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        // 忽略音频初始化错误
      }
    }
  },

  playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.context) return;
    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      // 忽略音频播放错误
    }
  },

  playSuccess() { this.playTone(523, 0.3, 0.15); },
  playError() { this.playTone(220, 0.4, 0.12); },
  playClick() { this.playTone(800, 0.1, 0.08); },
  playReward() { this.playTone(659, 0.25, 0.12); },
  playRareReward() {
    // 稀有卡牌音效
    const notes = [523, 659, 784];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2, 0.1), i * 100);
    });
  },
  playEpicReward() {
    // 史诗卡牌音效
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.25, 0.12), i * 80);
    });
  },
  playLegendaryReward() {
    // 传说卡牌音效
    const notes = [440, 523, 659, 784, 1047, 1319];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 0.15), i * 100);
    });
  },
  playVictory() { 
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.4, 0.2), i * 200);
    });
  },
  playWarning() { this.playTone(330, 0.5, 0.1); },
  playTimeUp() {
    // 时间到音效
    const notes = [440, 392, 349];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.8, 0.15), i * 300);
    });
  }
};

// ========== 工具函数 ==========
const formatTime = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ========== 游戏状态管理 ==========
const GameContext = createContext<{
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  addPlayer: (player: Omit<Player, 'id' | 'totalScore' | 'lastActive' | 'isWinner' | 'winTime' | 'collectedCards'>) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  addLog: (playerId: string, log: Omit<GameLog, 'timestamp'>) => void;
  addCard: (playerId: string, card: Omit<CollectedCard, 'timestamp'>) => void;
  playSound: (type: string) => void;
  resetGame: () => void;
  setCurrentPlayer: (playerId: string) => void;
} | null>(null);

const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentPage: 'home',
    players: {},
    currentPlayer: null,
    gameWinner: null,
    gameStartTime: Date.now(),
    gameEndTime: null,
    soundEnabled: true,
    gameSettings: GAME_SETTINGS,
    gameMode: 'setup',
    roomId: `room_${Date.now()}`,
    winnerTime: null
  });

  useEffect(() => {
    SoundManager.init();
  }, []);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  
  const addPlayer = (playerData: { name: string; color: string }) => {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlayer: Player = {
      ...playerData,
      id: playerId,
      coins: 0,
      shells: 0,
      completedZones: [],
      actionChances: GAME_SETTINGS.maxActionChances,
      log: [],
      achievements: [],
      totalScore: 0,
      lastActive: Date.now(),
      isWinner: false,
      winTime: null,
      collectedCards: []
    };
    
    setGameState(prev => ({
      ...prev,
      players: { ...prev.players, [playerId]: newPlayer }
    }));
    
    return playerId;
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => {
      const player = prev.players[playerId];
      if (!player) return prev;
      
      const updatedPlayer = { 
        ...player, 
        ...updates, 
        lastActive: Date.now()
      };
      
      // 计算总分
      updatedPlayer.totalScore = updatedPlayer.coins * 2 + updatedPlayer.shells * 5 + 
                                 updatedPlayer.completedZones.length * 10;
      
      return {
        ...prev,
        players: {
          ...prev.players,
          [playerId]: updatedPlayer
        }
      };
    });
  };

  const addLog = (playerId: string, log: Omit<GameLog, 'timestamp'>) => {
    const newLog: GameLog = { ...log, timestamp: Date.now() };
    const player = gameState.players[playerId];
    if (player) {
      updatePlayer(playerId, {
        log: [...player.log, newLog]
      });
    }
  };

  const addCard = (playerId: string, card: Omit<CollectedCard, 'timestamp'>) => {
    const newCard: CollectedCard = { ...card, timestamp: Date.now() };
    const player = gameState.players[playerId];
    if (player) {
      updatePlayer(playerId, {
        collectedCards: [...player.collectedCards, newCard]
      });
    }
  };

  const setCurrentPlayer = (playerId: string) => {
    setGameState(prev => ({ ...prev, currentPlayer: playerId }));
  };

  const playSound = (type: string) => {
    if (!gameState.soundEnabled) return;
    
    switch (type) {
      case 'success': SoundManager.playSuccess(); break;
      case 'error': SoundManager.playError(); break;
      case 'click': SoundManager.playClick(); break;
      case 'reward': SoundManager.playReward(); break;
      case 'rare': SoundManager.playRareReward(); break;
      case 'epic': SoundManager.playEpicReward(); break;
      case 'legendary': SoundManager.playLegendaryReward(); break;
      case 'victory': SoundManager.playVictory(); break;
      case 'warning': SoundManager.playWarning(); break;
      case 'timeup': SoundManager.playTimeUp(); break;
    }
  };

  const resetGame = () => {
    setGameState({
      currentPage: 'home',
      players: {},
      currentPlayer: null,
      gameWinner: null,
      gameStartTime: Date.now(),
      gameEndTime: null,
      soundEnabled: true,
      gameSettings: GAME_SETTINGS,
      gameMode: 'setup',
      roomId: `room_${Date.now()}`,
      winnerTime: null
    });
  };

  return (
    <GameContext.Provider value={{
      gameState,
      updateGameState,
      addPlayer,
      updatePlayer,
      addLog,
      addCard,
      playSound,
      resetGame,
      setCurrentPlayer
    }}>
      {children}
    </GameContext.Provider>
  );
};

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

// ========== 组件 ==========
const FloatingParticles: React.FC = () => {
  const emojis = ['🐠', '🐟', '🦑', '🦀', '🐙', '🦈', '🐡', '🦞', '🌊', '💫', '🌟', '🎐'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 10 - 5, 0],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </motion.div>
      ))}
    </div>
  );
};

const SoundToggle: React.FC = () => {
  const { gameState, updateGameState, playSound } = useGame();
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        updateGameState({ soundEnabled: !gameState.soundEnabled });
        if (!gameState.soundEnabled) playSound('click');
      }}
      className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white/90 transition-all"
    >
      <span className="text-xl">
        {gameState.soundEnabled ? '🔊' : '🔇'}
      </span>
    </motion.button>
  );
};

const GameTimer: React.FC = () => {
  const { gameState, playSound } = useGame();
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - gameState.gameStartTime;
      const remaining = Math.max(0, gameState.gameSettings.timeLimit * 60 * 1000 - elapsed);
      setTimeLeft(remaining);
      
      // 最后5分钟警告
      if (remaining <= 300000 && remaining > 299000 && !hasWarned) {
        playSound('warning');
        setHasWarned(true);
      }
      
      // 时间到
      if (remaining === 0) {
        playSound('timeup');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStartTime, gameState.gameSettings.timeLimit, hasWarned, playSound]);

  if (gameState.currentPage === 'home' || gameState.currentPage === 'setup') {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <motion.div 
      animate={{ 
        scale: timeLeft < 300000 ? [1, 1.05, 1] : 1,
        backgroundColor: timeLeft < 60000 ? ['rgba(255,255,255,0.9)', 'rgba(255,0,0,0.2)', 'rgba(255,255,255,0.9)'] : 'rgba(255,255,255,0.9)'
      }}
      transition={{ duration: 1, repeat: timeLeft < 300000 ? Infinity : 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⏰</span>
        <span className={`font-mono font-bold text-lg ${
          timeLeft < 60000 ? 'text-red-500' : 
          timeLeft < 300000 ? 'text-orange-500' : 'text-gray-700'
        }`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        {timeLeft === 0 && (
          <span className="text-red-500 font-bold ml-2">时间到！</span>
        )}
      </div>
    </motion.div>
  );
};

const Leaderboard: React.FC = () => {
  const { gameState } = useGame();
  
  const sortedPlayers = useMemo(() => {
    const players = Object.values(gameState.players);
    return players.sort((a, b) => {
      // 如果有获胜者，获胜者排第一，然后按获胜时间排序
      if (a.isWinner && !b.isWinner) return -1;
      if (!a.isWinner && b.isWinner) return 1;
      if (a.isWinner && b.isWinner) {
        return (a.winTime || 0) - (b.winTime || 0);
      }
      // 如果都没获胜，按总分排序
      return b.totalScore - a.totalScore;
    }).slice(0, 8);
  }, [gameState.players]);

  if (sortedPlayers.length === 0) return null;

  return (
    <motion.div 
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      className="fixed top-20 right-4 z-40 bg-white/95 backdrop-blur rounded-2xl p-4 w-80 shadow-xl max-h-[70vh] overflow-y-auto"
    >
      <h3 className="font-bold text-lg text-gray-800 mb-3 text-center">🏆 实时排行榜</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const color = PLAYER_COLORS.find(c => c.id === player.color);
          const isWinner = player.isWinner;
          const winTime = player.winTime ? formatTime(player.winTime - gameState.gameStartTime) : null;
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                isWinner ? 'border-yellow-400 bg-yellow-50' :
                index === 0 ? 'border-green-400 bg-green-50' :
                index === 1 ? 'border-gray-400 bg-gray-50' :
                index === 2 ? 'border-orange-400 bg-orange-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {isWinner ? '👑' :
                   index === 0 ? '🥇' : 
                   index === 1 ? '🥈' : 
                   index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div className={`w-3 h-3 rounded-full ${color?.bg || 'bg-gray-400'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate flex items-center gap-1">
                  {player.name}
                  {isWinner && <span className="text-xs text-yellow-600">⚡{winTime}</span>}
                </div>
                <div className="text-xs text-gray-500">
                  💰{player.coins} 🐚{player.shells} 🎴{player.collectedCards.length}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-sm">{player.totalScore}</div>
                <div className="text-xs text-gray-500">分</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {gameState.gameWinner && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border border-yellow-300"
        >
          <div className="text-center">
            <div className="text-lg mb-1">👑</div>
            <div className="font-bold text-yellow-700">
              {gameState.players[gameState.gameWinner]?.name} 获胜！
            </div>
            {gameState.winnerTime && (
              <div className="text-xs text-yellow-600">
                用时: {formatTime(gameState.winnerTime)}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const CardCollection: React.FC<{ playerId: string }> = ({ playerId }) => {
  const { gameState } = useGame();
  const [showCollection, setShowCollection] = useState(false);
  
  const player = gameState.players[playerId];
  if (!player) return null;

  const cardsByRarity = player.collectedCards.reduce((acc, card) => {
    if (!acc[card.rarity]) acc[card.rarity] = [];
    acc[card.rarity].push(card);
    return acc;
  }, {} as Record<string, CollectedCard[]>);

  return (
    <div className="mb-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCollection(!showCollection)}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-between"
      >
        <span>🎴 卡牌收藏 ({player.collectedCards.length})</span>
        <span>{showCollection ? '▲' : '▼'}</span>
      </motion.button>
      
      <AnimatePresence>
        {showCollection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 bg-white rounded-xl border border-purple-200 p-4 max-h-64 overflow-y-auto"
          >
            {Object.keys(cardsByRarity).length === 0 ? (
              <p className="text-gray-500 text-sm text-center">还没有收集到任何卡牌</p>
            ) : (
              <div className="space-y-3">
                {['legendary', 'epic', 'rare', 'common'].map(rarity => {
                  const cards = cardsByRarity[rarity];
                  if (!cards || cards.length === 0) return null;
                  
                  const rarityColors: Record<string, string> = {
  legendary: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  epic: 'text-purple-600 bg-purple-50 border-purple-200',
  rare: 'text-blue-600 bg-blue-50 border-blue-200',
  common: 'text-gray-600 bg-gray-50 border-gray-200'
};

const rarityNames: Record<string, string> = {
  legendary: '传说',
  epic: '史诗',
  rare: '稀有',
  common: '普通'
};
                  
                  return (
                    <div key={rarity}>
                      <h4 className={`text-sm font-bold mb-2 ${rarityColors[rarity].split(' ')[0]}`}>
                        {rarityNames[rarity]} ({cards.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {cards.map((card, index) => (
                          <div 
                            key={`${card.id}-${index}`}
                            className={`p-2 rounded-lg border ${rarityColors[rarity]}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{card.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{card.name}</div>
                                {card.type !== 'skip' && (
                                  <div className="text-xs opacity-75">+{card.amount}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { updateGameState, playSound } = useGame();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4 relative">
      <FloatingParticles />
      
      <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-4xl w-full text-center shadow-2xl relative z-10">
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotateY: [0, 10, 0, -10, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-9xl mb-6"
        >
          🐢
        </motion.div>
        
        <h1 className="text-5xl font-bold text-blue-800 mb-4">海龟岛冒险</h1>
        <div className="text-lg text-gray-600 mb-8 space-y-2">
          <p>🎯 <strong>多人竞赛模式</strong> - 最多15人同时竞争，谁最快获胜！</p>
          <p>🏆 第一个进入神殿并答对问题的玩家获胜，其他玩家可继续游戏</p>
          <p>⚡ 限时{GAME_SETTINGS.timeLimit}分钟，快速思考，勇敢探索</p>
          <p>🎴 收集50+种不同的海洋卡牌，学习丰富的海洋知识</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-xl">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold text-yellow-700">收集海龟币</div>
            <div className="text-xs text-gray-600 mt-1">答题获得奖励</div>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl">
            <div className="text-3xl mb-2">🐚</div>
            <div className="font-semibold text-purple-700">神秘贝壳</div>
            <div className="text-xs text-gray-600 mt-1">抽卡获得稀有物品</div>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl">
            <div className="text-3xl mb-2">🎴</div>
            <div className="font-semibold text-green-700">卡牌收集</div>
            <div className="text-xs text-gray-600 mt-1">收集珍稀卡牌</div>
          </div>
          <div className="bg-gradient-to-r from-red-100 to-orange-100 p-4 rounded-xl">
            <div className="text-3xl mb-2">🏛️</div>
            <div className="font-semibold text-red-700">神殿挑战</div>
            <div className="text-xs text-gray-600 mt-1">需要10币+3贝壳</div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound('click');
            updateGameState({ currentPage: 'setup' });
          }}
          className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 text-white px-12 py-5 rounded-2xl text-2xl font-bold shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-white opacity-20"
            animate={{ x: [-100, 300] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          开始多人竞赛 🚀
        </motion.button>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>💡 提示：支持最多15人同时游戏，每人使用独立设备</p>
          <p>🎮 游戏时长：{GAME_SETTINGS.timeLimit}分钟</p>
          <p>🌊 50+海洋知识问题，4种稀有度卡牌等你收集！</p>
        </div>
      </div>
    </div>
  );
};

const SetupPage: React.FC = () => {
  const { gameState, addPlayer, updateGameState, setCurrentPlayer, playSound } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [isJoining, setIsJoining] = useState(false);

  const availableColors = PLAYER_COLORS.filter(color => 
    !Object.values(gameState.players).some(player => player.color === color.id)
  );

  const handleJoinGame = () => {
    if (playerName.trim()) {
      setIsJoining(true);
      const playerId = addPlayer({
        name: playerName.trim(),
        color: selectedColor
      });
      setCurrentPlayer(playerId);
      playSound('success');
      
      setTimeout(() => {
        updateGameState({ 
          currentPage: 'lobby',
          gameMode: 'playing',
          gameStartTime: Date.now()
        });
      }, 1000);
    } else {
      playSound('error');
    }
  };

  const players = Object.values(gameState.players);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 flex items-center justify-center p-4 relative">
      <FloatingParticles />
      
      <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-6xl w-full shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🏴‍☠️
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">多人竞赛大厅</h2>
          <p className="text-gray-600">最多15人同时加入，谁最快获胜？</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 加入游戏表单 */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🎮 加入游戏</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">玩家昵称</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="输入你的昵称..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                maxLength={15}
                disabled={isJoining}
                onKeyPress={(e) => e.key === 'Enter' && !isJoining && playerName.trim() && handleJoinGame()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">选择你的海龟颜色</label>
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableColors.map(color => (
                  <motion.button
                    key={color.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedColor(color.id);
                      playSound('click');
                    }}
                    disabled={isJoining}
                    className={`p-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                      selectedColor === color.id 
                        ? `border-${color.id}-500 bg-gradient-to-r ${color.gradient} text-white shadow-lg` 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xl">🐢</span>
                      <span className="text-xs">{color.name}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
              {availableColors.length === 0 && (
                <p className="text-red-500 text-sm mt-2">所有颜色已被选择，请等待其他玩家开始游戏</p>
              )}
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playSound('click');
                  updateGameState({ currentPage: 'home' });
                }}
                disabled={isJoining}
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all"
              >
                返回首页
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinGame}
                disabled={!playerName.trim() || availableColors.length === 0 || isJoining}
                className="flex-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {isJoining ? '加入中...' : '加入竞赛 🌊'}
              </motion.button>
            </div>
          </div>

          {/* 当前玩家列表 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              👥 当前玩家 ({players.length}/{PLAYER_COLORS.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.map((player, index) => {
                const color = PLAYER_COLORS.find(c => c.id === player.color);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color?.gradient} flex items-center justify-center text-white text-xl font-bold`}>
                      🐢
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{player.name}</div>
                      <div className="text-sm text-gray-500">{color?.name}</div>
                    </div>
                    <div className="text-green-500 text-sm font-medium">
                      ✓ 已加入
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {players.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="font-semibold text-green-700 mb-2">
                    已有 {players.length} 位玩家加入！
                  </div>
                  <div className="text-sm text-gray-600">
                    最多可容纳{PLAYER_COLORS.length}人，点击"开始竞赛"开始游戏
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {players.length > 0 && (
          <div className="mt-8 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('success');
                updateGameState({ currentPage: 'map' });
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              开始多人竞赛！🏁
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapPage: React.FC = () => {
  const { gameState, updateGameState, updatePlayer, addLog, playSound, setCurrentPlayer } = useGame();
  
  // 如果没有当前玩家，显示玩家选择界面
  if (!gameState.currentPlayer) {
    const players = Object.values(gameState.players);
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-600 flex items-center justify-center p-4 relative">
        <FloatingParticles />
        
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-3xl w-full shadow-2xl text-center relative z-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">选择你的角色</h2>
          <p className="text-gray-600 mb-8">点击你的名字开始独立冒险！</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {players.map(player => {
              const color = PLAYER_COLORS.find(c => c.id === player.color);
              return (
                <motion.button
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCurrentPlayer(player.id);
                    playSound('click');
                  }}
                  className={`flex items-center gap-4 p-4 bg-gradient-to-r ${color?.gradient} text-white rounded-xl shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className="text-3xl">🐢</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-lg">{player.name}</div>
                    <div className="text-white/80 text-sm">{color?.name}</div>
                    <div className="text-white/90 text-xs">
                      💰{player.coins} 🐚{player.shells} 🎴{player.collectedCards.length}
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </motion.button>
              );
            })}
          </div>
          
          <button
            onClick={() => updateGameState({ currentPage: 'setup' })}
            className="mt-6 px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayer];
  if (!currentPlayer) return null;

  const playerColor = PLAYER_COLORS.find(c => c.id === currentPlayer.color);
  const canEnterTemple = currentPlayer.coins >= 10 && currentPlayer.shells >= 3;
  
  // 检查时间是否已到
  const timeLeft = Math.max(0, gameState.gameSettings.timeLimit * 60 * 1000 - (Date.now() - gameState.gameStartTime));
  const gameEnded = timeLeft === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-blue-400 to-blue-600 relative overflow-hidden">
      <FloatingParticles />
      <GameTimer />
      <SoundToggle />
      <Leaderboard />

      {/* 玩家信息侧边栏 */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-2xl p-6 w-80 shadow-xl z-20 max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-4">
          <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${playerColor?.gradient} flex items-center justify-center text-white text-2xl font-bold`}>
            🐢
          </div>
          <h3 className="font-bold text-xl text-gray-800">{currentPlayer.name}</h3>
          <div className={`text-sm ${playerColor?.text} font-medium`}>{playerColor?.name}</div>
          {currentPlayer.isWinner && (
            <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
              👑 获胜者
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-lg">💰</span>
                <span className="text-gray-700">海龟币</span>
              </span>
              <span className="font-bold text-lg text-yellow-600">{currentPlayer.coins}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-lg">🐚</span>
                <span className="text-gray-700">贝壳</span>
              </span>
              <span className="font-bold text-lg text-purple-600">{currentPlayer.shells}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-lg">⚡</span>
                <span className="text-gray-700">行动</span>
              </span>
              <span className="font-bold text-lg text-blue-600">{currentPlayer.actionChances}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-lg">🏆</span>
                <span className="text-gray-700">总分</span>
              </span>
              <span className="font-bold text-lg text-green-600">{currentPlayer.totalScore}</span>
            </div>
          </div>
        </div>

        {/* 卡牌收藏 */}
        <CardCollection playerId={currentPlayer.id} />

        {/* 行动次数恢复 */}
        {currentPlayer.actionChances === 0 && !gameEnded && !currentPlayer.isWinner && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-blue-700 mb-2">需要恢复能量？</h4>
              <p className="text-sm text-gray-600 mb-3">
                海龟岛的魔法让你可以重新获得行动力
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updatePlayer(currentPlayer.id, {
                    actionChances: Math.min(currentPlayer.actionChances + 3, 5)
                  });
                  addLog(currentPlayer.id, {
                    type: 'restore',
                    zone: 'system',
                    result: 'success',
                    reward: 3,
                    description: '恢复了3次行动机会'
                  });
                  playSound('reward');
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                🌊 恢复3次行动机会
              </motion.button>
            </div>
          </div>
        )}

        {/* 已完成区域 */}
        <div className="mb-6">
          <h4 className="font-semibold text-sm text-gray-600 mb-3">
            🗺️ 已探索区域 ({currentPlayer.completedZones.length}/5)
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentPlayer.completedZones.map(zoneId => {
              const zone = ZONES.find(z => z.id === zoneId);
              return zone ? (
                <motion.span 
                  key={zoneId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                >
                  {zone.emoji} {zone.name}
                </motion.span>
              ) : null;
            })}
          </div>
          {currentPlayer.completedZones.length === 5 && (
            <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="text-center">
                <div className="text-xl mb-1">🎉</div>
                <div className="text-sm font-semibold text-orange-600">
                  全区域探索完成！
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  可以重复挑战获得更多资源
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 切换玩家按钮 */}
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentPlayer('');
              playSound('click');
            }}
            className="w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            🔄 切换玩家
          </motion.button>
        </div>

        {/* 海龟神殿 */}
        <motion.button
          whileHover={canEnterTemple && !gameEnded ? { scale: 1.02 } : {}}
          whileTap={canEnterTemple && !gameEnded ? { scale: 0.98 } : {}}
          onClick={() => {
            if (canEnterTemple && !gameEnded) {
              playSound('success');
              updateGameState({ currentPage: 'temple' });
            } else {
              playSound('error');
            }
          }}
          disabled={!canEnterTemple || gameEnded}
          className={`w-full py-4 rounded-xl font-bold transition-all text-lg relative overflow-hidden ${
            canEnterTemple && !gameEnded
              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canEnterTemple && !gameEnded && (
            <motion.div
              className="absolute inset-0 bg-white opacity-20"
              animate={{ x: [-100, 400] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          🏛️ 海龟神殿
          {(!canEnterTemple || gameEnded) && (
            <div className="text-xs mt-1">
              {gameEnded ? '游戏已结束' : '需要 10币 + 3贝壳'}
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* 地图区域 */}
      <div className="flex-1 relative h-screen">
        {ZONES.map((zone, index) => {
          const isCompleted = currentPlayer.completedZones.includes(zone.id);
          const canPlay = currentPlayer.actionChances > 0 && !gameEnded && !currentPlayer.isWinner;
          
          return (
            <motion.button
              key={zone.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              whileHover={canPlay ? { scale: 1.1, y: -5 } : {}}
              whileTap={canPlay ? { scale: 0.95 } : {}}
              onClick={() => {
                if (canPlay) {
                  playSound('click');
                  updateGameState({ currentPage: `zone-${zone.id}` });
                } else {
                  playSound('error');
                }
              }}
              disabled={!canPlay}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                !canPlay 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:shadow-2xl cursor-pointer'
              }`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              <div className={`bg-gradient-to-r ${zone.bgColor} p-6 rounded-2xl shadow-lg min-w-[140px] border-4 ${
                isCompleted ? 'border-green-400' : canPlay ? 'border-white' : 'border-gray-300'
              }`}>
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-2"
                >
                  {zone.emoji}
                </motion.div>
                <div className="text-sm font-bold text-white mb-1">{zone.name}</div>
                <div className="text-xs text-white/80">{zone.description}</div>
                {isCompleted && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-200 text-xs mt-2 font-semibold"
                  >
                    ✅ 可重复挑战
                  </motion.div>
                )}
                {!canPlay && (
                  <div className="text-red-200 text-xs mt-2">
                    {gameEnded ? '⏰ 游戏结束' : currentPlayer.isWinner ? '👑 已获胜' : '⚡ 无行动次数'}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* 中央海龟岛 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 120, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity }
            }}
            className="text-9xl opacity-40"
          >
            🏝️
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl"
            >
              🐢
            </motion.div>
          </div>
        </div>
      </div>

      {/* 返回按钮 */}
      <button
        onClick={() => {
          playSound('click');
          updateGameState({ currentPage: 'setup' });
        }}
        className="fixed bottom-4 left-4 z-40 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-all"
      >
        <span className="text-2xl">🏠</span>
      </button>

      {/* 游戏结束提示 */}
      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">时间到！</h2>
            <p className="text-gray-600 mb-6">
              游戏时间已结束，查看最终排行榜吧！
            </p>
            <button
              onClick={() => setCurrentPlayer('')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
            >
              查看排行榜
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ZonePage: React.FC<{ zoneId: string }> = ({ zoneId }) => {
  const { gameState, updateGameState, updatePlayer, addLog, addCard, playSound } = useGame();
  const [taskType, setTaskType] = useState<'question' | 'card' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cardReward, setCardReward] = useState<typeof CARD_REWARDS[0] | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  const currentPlayer = gameState.currentPlayer ? gameState.players[gameState.currentPlayer] : null;
  const zone = ZONES.find(z => z.id === zoneId);

  useEffect(() => {
    const types: ('question' | 'card')[] = ['question', 'card'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    setTaskType(randomType);

    if (randomType === 'question') {
      const questions = QUESTIONS[zoneId] || [];
      if (questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQuestion);
      }
    }
  }, [zoneId]);

  const handleQuestionAnswer = () => {
    if (selectedAnswer === null || !currentQuestion || !currentPlayer) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setIsAnswerCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      playSound('success');
      const baseReward = currentQuestion.difficulty === 'easy' ? 1 : 
                        currentQuestion.difficulty === 'medium' ? 2 : 3;
      const bonusReward = Math.random() < 0.3 ? 1 : 0;
      const totalReward = baseReward + bonusReward;
      
      updatePlayer(currentPlayer.id, {
        coins: currentPlayer.coins + totalReward,
        actionChances: currentPlayer.actionChances - 1,
        completedZones: currentPlayer.completedZones.includes(zoneId) ? 
          currentPlayer.completedZones : [...currentPlayer.completedZones, zoneId]
      });
      
      addLog(currentPlayer.id, {
        type: 'question',
        zone: zoneId,
        result: 'success',
        reward: totalReward,
        description: `正确回答${currentQuestion.difficulty}难度问题`
      });
    } else {
      playSound('error');
      updatePlayer(currentPlayer.id, {
        actionChances: currentPlayer.actionChances - 1
      });
      
      addLog(currentPlayer.id, {
        type: 'question',
        zone: zoneId,
        result: 'failed',
        reward: 0,
        description: `回答错误，正确答案是：${currentQuestion.options[currentQuestion.answer]}`
      });
    }

    setTimeout(() => {
      updateGameState({ currentPage: 'map' });
    }, 4000);
  };

  const handleCardDraw = () => {
    if (!currentPlayer) return;

    const rarityWeights = { common: 50, rare: 30, epic: 15, legendary: 5 };
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    let selectedRarity = 'common';
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      currentWeight += weight;
      if (random <= currentWeight) {
        selectedRarity = rarity;
        break;
      }
    }

    const cardsOfRarity = CARD_REWARDS.filter(card => card.rarity === selectedRarity);
    const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
    
    setCardReward(randomCard);
    setShowResult(true);
    
    // 播放对应稀有度的音效
    switch (selectedRarity) {
      case 'legendary': playSound('legendary'); break;
      case 'epic': playSound('epic'); break;
      case 'rare': playSound('rare'); break;
      default: playSound('reward'); break;
    }

    let updates: Partial<Player> = {
      actionChances: currentPlayer.actionChances - 1,
      completedZones: currentPlayer.completedZones.includes(zoneId) ? 
        currentPlayer.completedZones : [...currentPlayer.completedZones, zoneId]
    };

    if (randomCard.type === 'coins') {
      updates.coins = currentPlayer.coins + randomCard.amount;
    } else if (randomCard.type === 'shells') {
      updates.shells = currentPlayer.shells + randomCard.amount;
    } else if (randomCard.type === 'bonus') {
      updates.coins = currentPlayer.coins + randomCard.amount;
      updates.shells = currentPlayer.shells + randomCard.amount;
    } else if (randomCard.type === 'action') {
      updates.actionChances = currentPlayer.actionChances + randomCard.amount;
    }

    updatePlayer(currentPlayer.id, updates);
    
    // 添加卡牌到收藏
    addCard(currentPlayer.id, {
      id: randomCard.id,
      name: randomCard.name,
      emoji: randomCard.emoji,
      rarity: randomCard.rarity,
      type: randomCard.type,
      amount: randomCard.amount
    });
    
    addLog(currentPlayer.id, {
      type: 'card',
      zone: zoneId,
      result: randomCard.type === 'skip' ? 'skip' : 'success',
      reward: randomCard.amount,
      description: `抽取到${randomCard.rarity}卡牌：${randomCard.name}`
    });

    setTimeout(() => {
      updateGameState({ currentPage: 'map' });
    }, 4000);
  };

  if (!zone || !currentPlayer) {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">出错了</h2>
          <button
            onClick={() => updateGameState({ currentPage: 'map' })}
            className="bg-white text-red-500 px-6 py-3 rounded-xl font-semibold"
          >
            返回地图
          </button>
        </div>
      </div>
    );
  }

  const playerColor = PLAYER_COLORS.find(c => c.id === currentPlayer.color);

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`min-h-screen bg-gradient-to-br ${zone.bgColor} flex items-center justify-center p-4 relative overflow-hidden`}
    >
      <FloatingParticles />
      <SoundToggle />
      
      <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-4"
          >
            {zone.emoji}
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">{zone.name}</h2>
          <p className="text-gray-600 mb-4">{zone.description}</p>
          
          {/* 玩家信息 */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${playerColor?.gradient} text-white`}>
            <span className="text-lg">🐢</span>
            <span className="font-semibold">{currentPlayer.name}</span>
          </div>
        </div>

        {!showResult && taskType === 'question' && currentQuestion && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤔</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? '简单' :
                   currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.question}</h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedAnswer(index);
                      playSound('click');
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-100 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && <span className="text-white text-sm">✓</span>}
                      </div>
                      {option}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <button
              onClick={handleQuestionAnswer}
              disabled={selectedAnswer === null}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              确认答案 ✨
            </button>
          </div>
        )}

        {!showResult && taskType === 'card' && (
          <div className="space-y-6 text-center">
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 p-8 rounded-2xl border border-purple-200">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🎴
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">神秘卡牌抽取</h3>
              <p className="text-gray-600 text-lg mb-4">
                在这个神秘的区域，你发现了一个古老的卡牌宝箱
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>💡 不同稀有度的卡牌有不同的奖励！</p>
                <div className="flex justify-center gap-4 mt-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">普通</span>
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">稀有</span>
                  <span className="bg-purple-100 px-2 py-1 rounded text-xs">史诗</span>
                  <span className="bg-yellow-100 px-2 py-1 rounded text-xs">传说</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCardDraw}
              className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              抽取卡牌 ✨
            </button>
          </div>
        )}

        {showResult && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            {taskType === 'question' && currentQuestion && (
              <div className={`p-8 rounded-2xl border-2 ${
                isAnswerCorrect 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
              }`}>
                <motion.div
                  animate={isAnswerCorrect ? 
                    { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } :
                    { x: [-10, 10, -10, 10, 0] }
                  }
                  transition={{ duration: 1 }}
                  className="text-7xl mb-6"
                >
                  {isAnswerCorrect ? '🎉' : '😔'}
                </motion.div>
                
                <h3 className={`text-3xl font-bold mb-4 ${
                  isAnswerCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isAnswerCorrect ? '太棒了！回答正确！' : '很遗憾，回答错误...'}
                </h3>
                
                <div className="bg-white/70 p-4 rounded-xl mb-4">
                  <p className="text-gray-700 font-medium mb-2">
                    正确答案：{currentQuestion.options[currentQuestion.answer]}
                  </p>
                  <p className="text-gray-600 text-sm">
                    💡 {currentQuestion.explanation}
                  </p>
                </div>
                
                {isAnswerCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-yellow-100 p-4 rounded-xl border border-yellow-300"
                  >
                    <p className="text-yellow-700 font-bold text-lg">
                      🎁 获得奖励：{currentQuestion.difficulty === 'easy' ? '1-2' : 
                                    currentQuestion.difficulty === 'medium' ? '2-3' : '3-4'} 个海龟币
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {taskType === 'card' && cardReward && (
              <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300">
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotateY: [0, 360, 720]
                  }}
                  transition={{ duration: 2 }}
                  className="text-7xl mb-6"
                >
                  {cardReward.emoji}
                </motion.div>
                
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                  cardReward.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                  cardReward.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                  cardReward.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                  'bg-yellow-200 text-yellow-700'
                }`}>
                  {cardReward.rarity === 'common' ? '普通' :
                   cardReward.rarity === 'rare' ? '稀有' :
                   cardReward.rarity === 'epic' ? '史诗' : '传说'} 卡牌
                </div>
                
                <h3 className="text-3xl font-bold text-purple-600 mb-4">{cardReward.name}</h3>
                
                <div className="bg-white/70 p-4 rounded-xl">
                  {cardReward.type === 'coins' && (
                    <p className="text-gray-700 font-semibold">💰 获得 {cardReward.amount} 个海龟币！</p>
                  )}
                  {cardReward.type === 'shells' && (
                    <p className="text-gray-700 font-semibold">🐚 获得 {cardReward.amount} 个神秘贝壳！</p>
                  )}
                  {cardReward.type === 'bonus' && (
                    <p className="text-gray-700 font-semibold">✨ 获得 {cardReward.amount} 个海龟币和 {cardReward.amount} 个神秘贝壳！</p>
                  )}
                  {cardReward.type === 'action' && (
                    <p className="text-gray-700 font-semibold">⚡ 获得 {cardReward.amount} 次额外行动机会！</p>
                  )}
                  {cardReward.type === 'skip' && (
                    <p className="text-gray-700 font-semibold">🌊 海浪冲击！这次没有获得奖励，但经验是无价的！</p>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-green-100 rounded-xl">
                  <p className="text-green-700 text-sm font-semibold">
                    🎴 卡牌已添加到你的收藏中！
                  </p>
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-gray-500"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.div>
                <span>即将返回地图...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* 返回按钮 */}
      <button
        onClick={() => {
          playSound('click');
          updateGameState({ currentPage: 'map' });
        }}
        className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-all"
      >
        <span className="text-2xl">←</span>
      </button>
    </motion.div>
  );
};

const TemplePage: React.FC = () => {
  const { gameState, updateGameState, updatePlayer, playSound } = useGame();
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentPlayer = gameState.currentPlayer ? gameState.players[gameState.currentPlayer] : null;
  const puzzle = TEMPLE_PUZZLES[currentPuzzle];

  const handleSubmit = () => {
    if (!currentPlayer || !puzzle) return;

    const userAnswer = answer.trim().toLowerCase();
    const correct = puzzle.answers.some(validAnswer => 
      userAnswer.includes(validAnswer.toLowerCase()) || 
      validAnswer.toLowerCase().includes(userAnswer)
    );

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      playSound('victory');
      
      const winTime = Date.now();
      const gameTime = winTime - gameState.gameStartTime;
      
      // 检查是否是第一个完成的玩家
      if (!gameState.gameWinner) {
        updateGameState({ 
          gameWinner: currentPlayer.id,
          winnerTime: gameTime
        });
        updatePlayer(currentPlayer.id, {
          isWinner: true,
          winTime: winTime,
          coins: currentPlayer.coins + 20,
          shells: currentPlayer.shells + 10
        });
      } else {
        // 不是第一个获胜，但仍然完成了挑战
        updatePlayer(currentPlayer.id, {
          isWinner: true,
          winTime: winTime,
          coins: currentPlayer.coins + 10,
          shells: currentPlayer.shells + 5
        });
      }
    } else {
      playSound('error');
    }
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-yellow-500 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">没有找到玩家信息</h2>
          <button
            onClick={() => updateGameState({ currentPage: 'map' })}
            className="bg-white text-yellow-500 px-6 py-3 rounded-xl font-semibold"
          >
            返回地图
          </button>
        </div>
      </div>
    );
  }

  const playerColor = PLAYER_COLORS.find(c => c.id === currentPlayer.color);

  // 胜利页面
  if (currentPlayer.isWinner) {
    const isFirstWinner = gameState.gameWinner === currentPlayer.id;
    const winTime = currentPlayer.winTime ? formatTime(currentPlayer.winTime - gameState.gameStartTime) : '';
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingParticles />
        <SoundToggle />
        
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-2xl w-full shadow-2xl text-center relative z-10">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotateY: [0, 360, 720] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            {isFirstWinner ? '👑' : '🏆'}
          </motion.div>
          
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl font-bold text-yellow-600 mb-4"
          >
            {isFirstWinner ? '🎉 恭喜获得冠军！🎉' : '🎉 恭喜完成挑战！🎉'}
          </motion.h1>
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl mb-6 border-2 border-yellow-300">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${playerColor?.gradient} flex items-center justify-center text-white text-3xl font-bold`}>
              🐢
            </div>
            <h2 className="text-3xl font-bold text-orange-600 mb-4">
              {currentPlayer.name}
            </h2>
            <p className="text-xl text-gray-700 mb-4">
              {isFirstWinner ? '🏆 荣获海龟王之证！🏆' : '🏆 成功完成神殿挑战！🏆'}
            </p>
            <div className="mb-4">
              <div className="text-lg font-bold text-blue-600">
                完成时间: {winTime}
              </div>
              {isFirstWinner && (
                <div className="text-sm text-green-600 font-semibold mt-1">
                  ⚡ 第一名获胜者！
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              你成功解开了海龟神殿的终极谜题，成为了真正的海洋守护者！
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-bold text-yellow-600">{currentPlayer.coins} 海龟币</div>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <div className="text-2xl mb-2">🐚</div>
                <div className="font-bold text-purple-600">{currentPlayer.shells} 神秘贝壳</div>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <div className="text-2xl mb-2">🎴</div>
                <div className="font-bold text-pink-600">{currentPlayer.collectedCards.length} 张卡牌</div>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-bold text-blue-600">{currentPlayer.totalScore} 总分</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                updateGameState({ currentPage: 'map' });
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg"
            >
              查看最终排行榜
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                updateGameState({ currentPage: 'home' });
              }}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg"
            >
              开始新的竞赛
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      <SoundToggle />
      
      <div className="bg-white/95 backdrop-blur rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-8xl mb-4"
          >
            🏛️
          </motion.div>
          <h2 className="text-4xl font-bold text-yellow-600 mb-2">海龟神殿</h2>
          <p className="text-gray-600 mb-4">解答终极谜题，获得海龟王之证！</p>
          
          {/* 玩家信息 */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${playerColor?.gradient} text-white`}>
            <span className="text-lg">🐢</span>
            <span className="font-semibold">{currentPlayer.name}</span>
          </div>
          
          {/* 竞争状态 */}
          {gameState.gameWinner && (
            <div className="mt-4 p-3 bg-orange-100 rounded-xl border border-orange-300">
              <div className="text-orange-700 text-sm">
                ⚠️ {gameState.players[gameState.gameWinner]?.name} 已获得冠军，但你仍可完成挑战！
              </div>
            </div>
          )}
        </div>

        {!showResult && puzzle && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-2xl border-2 border-yellow-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🤔</span>
                <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                  终极谜题
                </span>
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                {puzzle.question}
              </h3>
              
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="请输入你的答案..."
                className="w-full px-6 py-4 border-2 border-yellow-300 rounded-xl text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && answer.trim() && handleSubmit()}
              />
              
              <p className="text-sm text-gray-500 mt-2">
                💡 提示：答案可能有多种表达方式，尽量用准确的词汇
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  playSound('click');
                  updateGameState({ currentPage: 'map' });
                }}
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
              >
                返回地图
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="flex-2 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                提交答案 🔮
              </button>
            </div>
          </div>
        )}

        {showResult && puzzle && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className={`p-8 rounded-2xl border-2 ${
              isCorrect 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
            }`}>
              <motion.div
                animate={isCorrect ? 
                  { scale: [1, 1.3, 1], rotate: [0, 360] } :
                  { x: [-10, 10, -10, 10, 0] }
                }
                transition={{ duration: 1 }}
                className="text-7xl mb-6"
              >
                {isCorrect ? '🎉' : '😔'}
              </motion.div>
              
              <h3 className={`text-3xl font-bold mb-4 ${
                isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {isCorrect ? '太棒了！答案正确！' : '很遗憾，答案不正确...'}
              </h3>
              
              <div className="bg-white/70 p-4 rounded-xl mb-4">
                <p className="text-gray-700 font-medium mb-2">
                  参考答案：{puzzle.answers.join('、')}
                </p>
                <p className="text-gray-600 text-sm">
                  💡 {puzzle.explanation}
                </p>
              </div>
              
              {isCorrect && (
                <p className="text-green-600 font-semibold text-lg">
                  🏆 恭喜！你获得了海龟王之证！
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* 返回按钮 */}
      <button
        onClick={() => {
          playSound('click');
          updateGameState({ currentPage: 'map' });
        }}
        className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-all"
      >
        <span className="text-2xl">←</span>
      </button>
    </div>
  );
};

// ========== 主应用 ==========
const GameApp: React.FC = () => {
  const { gameState } = useGame();

  const renderCurrentPage = () => {
    switch (gameState.currentPage) {
      case 'home': return <HomePage />;
      case 'setup': return <SetupPage />;
      case 'lobby': return <SetupPage />;
      case 'map': return <MapPage />;
      case 'temple': return <TemplePage />;
      default:
        if (gameState.currentPage.startsWith('zone-')) {
          const zoneId = gameState.currentPage.replace('zone-', '');
          return <ZonePage zoneId={zoneId} />;
        }
        return <HomePage />;
    }
  };

  return (
    <div className="font-sans min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function SeaTurtleQuest() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}