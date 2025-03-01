/**
 * 本文件是在构建 Wordle 程序过程中需要使用的脚本
 * ! 在编写代码之前请您务必仔细阅读每一行注释
 * 其中部分函数已经给出，需要您根据实际需求进行补全
 * 函数的具体作用请参考注释
 * 请确保所有的 TODO 都被补全
 * 若无特殊需要请尽量不要定义新的函数
 */

/**
 * Global Variables
 *
 * 您的所有全局变量需要在此处定义
 * 我们已经预先为您定义了一部分全局变量
 *
 * 请思考：
 *
 * 1. 为什么使用 let/const 来定义变量而不是 var 关键字
 * 2. let 和 const 关键字定义的变量有什么区别
 * 3. 已经被预定义的全局变量分别有怎样的作用
 */

// 固定的答案长度
const answerLength = 5;
// 最多尝试次数
const maxGuessTime = 6;

// Wordle 中出现的三种颜色，更推荐使用枚举
// 此处 grey 用字母 b 表示，具体原因请参见代码任务
const grey = "b";
const yellow = "y";
const green = "g";

// 颜色序列，类型为 string[]
let colorSequence = [];
// 单词序列，类型为 string[]
let wordSequence = [];
let currentRow = 0;
// 本次 Wordle 的答案
let answer = "";
// 当前猜测的答案
let guess = "";
// 当前已经使用的猜测次数
let currentGuessTime = 0;
let keyboardState = {}; // 存储键盘上每个字母的状态
let wordList = []; // 存储从 JSON 文件中加载的单词列表
/**
 * 程序当前的状态，更推荐使用枚举
 *
 * 预计会使用到的状态：
 * 1. "UNFINISHED": 表示 Wordle 未被解决即仍有剩余猜测次数
 * 2. "SOLVED": 表示当前 Wordle 已被解决
 * 3. "FAILED": 表示当前 Wordle 解决失败
 * 可以根据需要设计新的状态
 */
let state = "UNFINISHED";

/**
 * 预定义的 JavaScript 程序的入口
 * 请不要额外定义其他的程序入口
 */
start();

/**
 * start()
 *
 * 整个程序的入口函数，这里为了简化程序的运行逻辑违背了单一指责原则和最小权限原则，在实际开发时不推荐这样处理
 *
 * 您需要完成的任务：
 * 1. 初始化程序的运行状态
 * 2. 接收交互信息后改变内部状态并作出反馈
 *
 * 请思考：
 * 1. 在怎样的时刻需要调用 initialize 函数
 * 2. 程序的交互信息是什么（猜测的单词？）
 * 3. 内部状态会如何根据交互信息而改变（state 变量的作用？）
 * 4. 程序内部状态变化之后会作出怎样的反馈（页面重新渲染？）
 * 5. 如何读取交互信息
 * 6. 程序在什么时候会终止
 */
function start() {
    document.addEventListener('DOMContentLoaded', () => {
        // 使用 fetch API 从指定路径加载单词列表 JSON 文件
        fetch('static/words.json')
          .then(response => {
                // 检查响应是否成功
                if (!response.ok) {
                    // 若响应失败，抛出错误
                    throw new Error('Network response was not ok');
                }
                // 将响应数据解析为 JSON 格式
                return response.json();
            })
          .then(data => {
                // 将解析后的单词列表存储到 wordList 数组中
                wordList = data.words;
                // 隐藏加载提示信息
                showAlert('');
                document.addEventListener('keydown', (event) =>{
                    if (state!== 'UNFINISHED') return; // 如果游戏已结束，不处理键盘事件
                    const key = event.key.toLowerCase(); // 获取按下的键，转换为小写
                    if (key === 'enter') submitGuess(); // 按下回车键，提交猜测
                    else if (key === 'backspace') deleteLastChar(); // 按下退格键，删除最后一个字符
                    else if (/^[a-z]$/.test(key)) addChar(key); // 按下字母键，添加字符
                });
                // 为键盘按钮绑定点击事件
                document.querySelectorAll('.keyboard button').forEach(button => {
                    button.addEventListener('click', () => {
                        const key = button.dataset.key.toLowerCase();
                        if (key === 'enter') submitGuess(); // 点击回车键，提交猜测
                        else if (key === 'backspace') deleteLastChar(); // 点击退格键，删除最后一个字符
                        else addChar(key); // 点击字母键，添加字符
                    });
                });
            
                // 为重启按钮绑定点击事件
                document.getElementById('restart-button').addEventListener('click', initialize);
                initialize();
            })
          .catch(error => {
                // 若加载过程中出现错误，在控制台输出错误信息
                console.error('Error loading word list:', error);
                // 显示加载失败提示信息，持续 3000 毫秒
                showAlert('Failed to load word list', 3000);
            });
    });
}

/**
 * render()
 *
 * 根据程序当前的状态渲染对应的用户页面
 *
 * 您需要完成的任务：
 * 1. 基于 DOM 实现程序状态和 HTML 组件的绑定
 * 2. 当程序内部状态发生改变时需要重新渲染页面
 *
 * 请思考：
 * 1. 什么是 DOM，这项技术有怎样的作用
 * 2. 如何实现程序内部状态和 HTML 组件的绑定，为什么要这么设计
 * 3. 应该在怎样的时刻调用 render 函数
 */
function render() {
    const board = document.getElementById('board'); // 获取棋盘元素
    const currentRow = board.children[currentGuessTime]; // 获取当前猜测行的元素

    if (currentRow) {
        const tiles = currentRow.querySelectorAll('.tile'); // 获取当前行的所有格子元素

        for (let j = 0; j < answerLength; j++) {
            const tile = tiles[j]; // 获取当前格子元素

            if (wordSequence[currentGuessTime]) {
                // 如果当前猜测行已有猜测单词，更新格子的文本内容
                tile.textContent = wordSequence[currentGuessTime][j];
                // 移除格子的颜色类名
                tile.classList.remove('green', 'yellow', 'gray');
                // 根据颜色序列添加相应的颜色类名
                tile.classList.add(
                    colorSequence[currentGuessTime][j] === green ? 'green' :
                    colorSequence[currentGuessTime][j] === yellow ? 'yellow' : 'gray'
                );
            } else if (currentGuessTime === currentGuessTime) {
                // 如果当前猜测行还没有猜测单词，更新格子的文本内容
                tile.textContent = guess[j] || '';
                // 设置格子的状态属性
                tile.dataset.state = guess[j] ? 'active' : '';
                // 移除格子的颜色类名
                tile.classList.remove('green', 'yellow', 'gray');
            }
        }
    }
    updateKeyboard(); // 更新键盘的显示
}

/**
 * initialize()
 *
 * 初始化程序的状态
 *
 * 请思考：
 * 1. 有哪些状态或变量需要被初始化
 * 2. 初始化时 state 变量处于怎样的状态
 */
function initialize() {
    answer = generateRandomAnswer();
    const dynamicContent = document.getElementById('dynamic-content');
    // 清空动态内容区域的之前内容
    dynamicContent.innerHTML = '';

    const board = document.getElementById('board');
    // 清空棋盘的之前内容
    board.innerHTML = '';

    // 创建棋盘的行和格子
    for (let i = 0; i < maxGuessTime; i++) {
        const row = document.createElement('div');
        row.className = 'row';

        for (let j = 0; j < answerLength; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            row.appendChild(tile);
        }
        board.appendChild(row);
    }

    const alert = document.getElementById('alert');
    // 清空提示信息
    alert.textContent = "";

    // 重置游戏状态变量
    currentGuessTime = 0;
    state = "UNFINISHED";
    wordSequence = [];
    colorSequence = [];
    guess = '';

    // 初始化键盘状态对象，将所有字母的状态设为 null
    for (let i = 97; i <= 122; i++) {
        keyboardState[String.fromCharCode(i)] = null;
    }

    render(); // 渲染游戏界面
    document.getElementById('restart-button').style.display = 'none'; // 隐藏重启按钮
}


/**
 * generateRandomAnswer()
 *
 * 从题库中随机选取一个单词作为答案
 *
 * 单词文件位于 /static/words.json 中
 *
 * 请思考：
 * 1. 如何读取 json 文件
 * 2. 如何随机抽取一个单词
 *
 * @return {string} answer
 */
function generateRandomAnswer() {
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    return word;
}
/**
 * isValidWord()
 *
 * 判断一个单词是否合法
 *
 * 请思考：
 * 1. 判断一个单词是否合法的规则有哪些
 * 2. 是否存在多条判断规则
 * 3. 如果上条成立，那么这些规则执行的先后顺序是怎样的，不同的执行顺序是否会对单词的合法性判断造成影响
 * 4. 如果单词不合法，那么程序的状态会如何变化，程序应当作出怎样的反馈
 *
 * @param {string} word
 * @return {boolean} isValid
 */
function isValidWord(word) {
    
    // 检查猜测单词的长度是否符合要求
    if (word.length!== answerLength) {
        showAlert('Not enough letters', 1000); // 显示提示信息，持续 1000 毫秒
        shakeRow(currentRow); // 摇晃当前行
        return false;
    }

    // 检查猜测单词是否在单词列表中
    if (!wordList.includes(word.toLowerCase())) {
        showAlert('Not in word list', 1000); // 显示提示信息，持续 1000 毫秒
        shakeRow(currentRow); // 摇晃当前行
        return false;
    }
    return true;

}

/**
 * handleAnswer()
 *
 * 处理一次对单词的猜测，并根据其猜测结果更新程序内部状态
 *
 * 请思考：
 * 1. 是否需要对 guess 变量的字符串作某种预处理，为什么
 *
 * @param {string} guess
 */
function handleAnswer() {
    guess = guess.toLowerCase(); // 将猜测单词转换为小写
    const board = document.getElementById('board');
    currentRow = board.children[currentGuessTime];
    if(!isValidWord(guess))
        {
            return;
        }
    const colors = calculateColorSequence(guess, answer); // 计算猜测单词的颜色序列
    colorSequence.push(colors.split('')); // 将颜色序列分割并添加到 colorSequence 数组中
    wordSequence.push(guess); // 将猜测单词添加到 wordSequence 数组中

    // 遍历猜测单词的每个字母，更新键盘状态
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const color = colors[i];
        if (color === green) {
            keyboardState[letter] = green;
        } else if (color === yellow && keyboardState[letter]!== green) {
            keyboardState[letter] = yellow;
        } else if (color === grey && keyboardState[letter]!== green && keyboardState[letter]!== yellow) {
            keyboardState[letter] = grey;
        }
    }

    render(); // 渲染游戏界面

    // 检查游戏是否获胜
    if (guess === answer) {
        state = "SOLVED"; // 更新游戏状态为已解决
        gameOver(); // 游戏结束处理
    } else if (currentGuessTime >= maxGuessTime - 1) {
        state = "FAILED"; // 更新游戏状态为失败
        gameOver(); // 游戏结束处理
    } else {
        guess = ""; // 清空当前猜测单词
        currentGuessTime++; // 增加猜测次数
    }

    // 如果游戏结束，显示重启按钮
    if (state!== 'UNFINISHED') {
        document.getElementById('restart-button').style.display = 'block';//TODO
    }
    return;
}

/**
 * calculateColorSequence()
 *
 * 计算两个单词的颜色匹配序列
 *
 * 例如：
 * 给定 answer = "apple", guess = "angel"
 *
 * 那么返回结果为："gbbyy"
 *
 * 请思考：
 * 1. Wordle 的颜色匹配算法是如何实现的
 * 2. 有哪些特殊的匹配情况
 *
 * @param {string} guess
 * @param {string} answer
 * @return {string} colorSequence
 */

// 计算颜色序列函数，根据猜测单词和正确答案计算每个字母的颜色
function calculateColorSequence(guess, answer) {
    const result = Array(answerLength).fill(grey); // 初始化结果数组，全部填充为灰色
    const answerCount = {}; // 存储正确答案中每个字母的出现次数
    const guessArr = guess.split(''); // 将猜测单词分割为字符数组
    const answerArr = answer.split(''); // 将正确答案分割为字符数组

    // 第一次遍历，找出完全匹配的字母，标记为绿色
    guessArr.forEach((char, i) => {
        if (char === answerArr[i]) {
            result[i] = green;
            answerCount[char] = (answerCount[char] || 0) + 1; // 增加该字母的出现次数
        }
    });

    // 第二次遍历，找出部分匹配的字母，标记为黄色
    guessArr.forEach((char, i) => {
        if (result[i] === green) return; // 如果已经是绿色，跳过

        const total = answerArr.filter(c => c === char).length; // 统计正确答案中该字母的总出现次数
        const used = answerCount[char] || 0; // 统计已经使用的该字母的次数

        if (total > used) { // 如果还有未使用的该字母
            result[i] = yellow;
            answerCount[char] = used + 1; // 增加该字母的使用次数
        }
    });

    return result.join(''); // 将结果数组转换为字符串并返回
}


// 更新键盘显示函数，根据键盘状态更新键盘按钮的颜色
function updateKeyboard() {
    document.querySelectorAll('.keyboard button').forEach(button => {
        const key = button.dataset.key.toLowerCase(); // 获取按钮对应的字母，转换为小写

        if (key!== 'enter' && key!== 'backspace') {
            const state = keyboardState[key]; // 获取该字母的状态
            if (state) {
                // 根据状态设置按钮的 data-state 属性
                button.dataset.state = state === green ? 'green' : state === yellow ? 'yellow' : 'gray';
            } else {
                button.removeAttribute('data-state'); // 若状态为 null，移除 data-state 属性
            }
        }
    });
}

// 添加字符函数，将字符添加到当前猜测单词中
function addChar(char) {
    if (guess.length < answerLength) {
        guess += char;
        render(); // 渲染游戏界面
    }
}

// 删除最后一个字符函数，删除当前猜测单词的最后一个字符
function deleteLastChar() {
    guess = guess.slice(0, -1);
    render(); // 渲染游戏界面
}

// 提交猜测函数，处理猜测并渲染界面
function submitGuess() {
    handleAnswer(); // 处理猜测
    render(); // 渲染游戏界面
}

// 显示提示信息函数，在指定区域显示提示信息，并可设置显示时长
function showAlert(message, duration = 0) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    if (duration!== 0) {
        setTimeout(() => alert.textContent = '', duration); // 若设置了显示时长，超时后清空提示信息
    }
}

// 摇晃行函数，为指定行添加摇晃动画效果
function shakeRow(currentRow) {
    currentRow.classList.add('shake'); // 添加 shake 类名，触发动画
    // 动画结束后移除 shake 类名
    setTimeout(() => {
        currentRow.classList.remove('shake');
    }, 600);
}

// 插入动态内容函数，在指定区域插入文本和图片
function insertDynamicContent(text, imageUrl) {
    const dynamicContent = document.getElementById('dynamic-content');
    // 清空动态内容区域的之前内容
    dynamicContent.innerHTML = '';

    // 创建段落元素并设置文本内容
    const textElement = document.createElement('p');
    textElement.textContent = text;

    // 创建图片元素并设置图片路径和替代文本
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.alt = 'Dynamic Image';

    // 将文本元素和图片元素添加到动态内容区域
    dynamicContent.appendChild(textElement);
    dynamicContent.appendChild(imageElement);
}

// 游戏结束处理函数，根据游戏结果显示相应的提示信息和动态内容
function gameOver() {
    if (state === "SOLVED") {
        showAlert('Congratulations!'); // 显示获胜提示信息

        if (currentGuessTime === 0) {
            insertDynamicContent("一命通关???开了???", "img/first.gif"); // 显示一命通关的动态内容
        } else if (currentGuessTime === 5) {
            insertDynamicContent("极限!!!开香槟咯!!!", "img/nb.png"); // 显示极限通关的动态内容
        } else {
            insertDynamicContent("哦哦哦耶耶耶,赢!!!", "img/win.gif"); // 显示普通获胜的动态内容
        }
    } else {
        showAlert(`Answer: ${answer}`); // 显示正确答案

        let colorsCount = countboardColors(); // 统计棋盘上绿色和黄色的数量
        let yellowCount = colorsCount.yellow;
        let greenCount = colorsCount.green;

        if (yellowCount === 0 && greenCount === 0) {
            insertDynamicContent("一个都猜不到吗???", "img/0.jpg"); // 显示未猜对任何字母的动态内容
        } 
          else if (greenCount >= 4) {
            insertDynamicContent("一步之遥!!!", "img/justoneqwq.gif"); // 显示接近猜对的动态内容
        } else {
            insertDynamicContent("GG", "img/GG.gif"); // 显示失败的动态内容
        }
    }
}

// 统计棋盘颜色函数，统计棋盘上每列绿色和黄色的数量
function countboardColors() {
    const board = document.getElementById('board');
    const rows = board.querySelectorAll('.row');
    const columnColorCount = [];
    let guessgreenCount = 0;
    let guessyellowCount = 0;

    // 初始化每列的颜色统计对象
    for (let j = 0; j < answerLength; j++) {
        columnColorCount[j] = {
            green: 0,
            yellow: 0,
            gray: 0
        };
    }

    // 遍历每一行
    rows.forEach(row => {
        const tiles = row.querySelectorAll('.tile');
        // 遍历每一列
        tiles.forEach((tile, j) => {
            if (tile.classList.contains('green')) {
                columnColorCount[j].green++;
            } else if (tile.classList.contains('yellow')) {
                columnColorCount[j].yellow++;
            } else if (tile.classList.contains('gray')) {
                columnColorCount[j].gray++;
            }
        });
    });

    // 统计每列至少有一个绿色或黄色的列数
    for (let j = 0; j < answerLength; j++) {
        if (columnColorCount[j].green >= 1) {
            guessgreenCount++;
        } else if (columnColorCount[j].yellow >= 1) {
            guessyellowCount++;
        }
    }

    const guessCount = {
        green: guessgreenCount,
        yellow: guessyellowCount
    };

    return guessCount;
}