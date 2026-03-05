#!/usr/bin/env node
/**
 * Glimmer Closet - Telegram Message Handler
 * 
 * This script processes Telegram messages to upload clothes to the Closet API.
 * Usage: Set as webhook handler or use with OpenClaw message forwarding.
 */

const CLOSET_API_URL = process.env.CLOSET_API_URL || 'http://localhost:4001';
const ADMIN_TOKEN = process.env.CLOSET_ADMIN_TOKEN || 'dev_token';

// Parse natural language input to structured data
function parseClothInput(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 0) return null;
  
  const result = {
    name: lines[0],
    category: 'top', // default
    colors: [],
    seasons: [],
    occasions: ['daily'],
    description: null
  };
  
  const categoryMap = {
    '上衣': 'top', '衣服': 'top', '衬衫': 'top', 't恤': 'top', '卫衣': 'top',
    '裤子': 'bottom', '长裤': 'bottom', '短裤': 'bottom', '牛仔裤': 'bottom',
    '裙子': 'dress', '连衣裙': 'dress', '短裙': 'dress',
    '外套': 'outerwear', '大衣': 'outerwear', '夹克': 'outerwear', '羽绒服': 'outerwear',
    '鞋子': 'shoes', '鞋': 'shoes', '运动鞋': 'shoes', '高跟鞋': 'shoes',
    '配饰': 'accessory', '首饰': 'accessory', '围巾': 'accessory', '帽子': 'accessory',
    '包包': 'bag', '包': 'bag', '手提包': 'bag', '背包': 'bag'
  };
  
  const colorMap = {
    '黑': 'black', '黑色': 'black',
    '白': 'white', '白色': 'white',
    '灰': 'gray', '灰色': 'gray',
    '红': 'red', '红色': 'red',
    '蓝': 'blue', '蓝色': 'blue',
    '绿': 'green', '绿色': 'green',
    '黄': 'yellow', '黄色': 'yellow',
    '粉': 'pink', '粉色': 'pink',
    '紫': 'purple', '紫色': 'purple',
    '棕': 'brown', '棕色': 'brown',
    '米色': 'beige', '米': 'beige',
    '花': 'multicolor', '花色': 'multicolor', '彩色': 'multicolor'
  };
  
  const seasonMap = {
    '春': 'spring', '春天': 'spring',
    '夏': 'summer', '夏天': 'summer',
    '秋': 'autumn', '秋天': 'autumn',
    '冬': 'winter', '冬天': 'winter',
    '四季': 'all-season', '全年': 'all-season'
  };
  
  const occasionMap = {
    '日常': 'daily', '平时': 'daily',
    '工作': 'work', '上班': 'work', '商务': 'work',
    '运动': 'sport', '健身': 'sport',
    '正式': 'formal', '宴会': 'formal', '礼服': 'formal',
    '休闲': 'casual', '休闲装': 'casual'
  };
  
  for (const line of lines.slice(1)) {
    // Category
    for (const [cn, en] of Object.entries(categoryMap)) {
      if (line.includes(cn) || line.includes('分类') && line.includes(cn)) {
        result.category = en;
      }
    }
    
    // Colors
    for (const [cn, en] of Object.entries(colorMap)) {
      if (line.includes(cn) || (line.includes('颜色') && line.includes(cn))) {
        if (!result.colors.includes(en)) result.colors.push(en);
      }
    }
    
    // Seasons
    for (const [cn, en] of Object.entries(seasonMap)) {
      if (line.includes(cn) || (line.includes('季节') && line.includes(cn))) {
        if (!result.seasons.includes(en)) result.seasons.push(en);
      }
    }
    
    // Occasions
    for (const [cn, en] of Object.entries(occasionMap)) {
      if (line.includes(cn) || (line.includes('场合') && line.includes(cn))) {
        if (!result.occasions.includes(en)) result.occasions.push(en);
      }
    }
    
    // Description
    if (line.includes('备注') || line.includes('描述') || line.includes('说明')) {
      result.description = line.split(/[：:]/)[1]?.trim() || line;
    }
  }
  
  // Set defaults if empty
  if (result.colors.length === 0) result.colors = ['multicolor'];
  if (result.seasons.length === 0) result.seasons = ['all-season'];
  
  return result;
}

// Upload cloth to API
async function uploadCloth(data, imageBuffer = null) {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('colors', JSON.stringify(data.colors));
    formData.append('seasons', JSON.stringify(data.seasons));
    formData.append('occasions', JSON.stringify(data.occasions));
    if (data.description) formData.append('description', data.description);
    
    if (imageBuffer) {
      formData.append('image', new Blob([imageBuffer]), 'upload.jpg');
    }
    
    const response = await fetch(`${CLOSET_API_URL}/v1/clothes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      shortCode: result.shortCode,
      name: result.name,
      message: `✅ 已添加：${result.name}\n编码：${result.shortCode}`
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ 上传失败：${error.message}`
    };
  }
}

// Query clothes
async function queryClothes(query) {
  try {
    const params = new URLSearchParams();
    
    // Parse query intent
    if (query.includes('外套') || query.includes('大衣')) params.set('category', 'outerwear');
    else if (query.includes('上衣') || query.includes('衣服')) params.set('category', 'top');
    else if (query.includes('裤子')) params.set('category', 'bottom');
    else if (query.includes('裙子')) params.set('category', 'dress');
    else if (query.includes('鞋子') || query.includes('鞋')) params.set('category', 'shoes');
    else if (query.includes('包')) params.set('category', 'bag');
    else if (query.includes('配饰')) params.set('category', 'accessory');
    
    // Colors
    if (query.includes('黑')) params.set('colors', 'black');
    else if (query.includes('白')) params.set('colors', 'white');
    else if (query.includes('红')) params.set('colors', 'red');
    else if (query.includes('蓝')) params.set('colors', 'blue');
    
    // Seasons
    if (query.includes('春')) params.set('seasons', 'spring');
    else if (query.includes('夏')) params.set('seasons', 'summer');
    else if (query.includes('秋')) params.set('seasons', 'autumn');
    else if (query.includes('冬')) params.set('seasons', 'winter');
    
    // Search text
    if (!params.toString()) {
      params.set('q', query.replace(/查看|查找|找/g, '').trim());
    }
    
    const response = await fetch(`${CLOSET_API_URL}/v1/clothes?${params}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (!response.ok) throw new Error('Query failed');
    
    const data = await response.json();
    const items = data.items || [];
    
    if (items.length === 0) {
      return '📭 没有找到匹配的衣服';
    }
    
    let result = `📋 找到 ${items.length} 件衣服：\n\n`;
    items.slice(0, 10).forEach((item, i) => {
      result += `${i + 1}. ${item.name} (${item.shortCode})\n`;
      result += `   ${item.category} | ${item.colors.join(', ')} | ${item.seasons.join(', ')}\n\n`;
    });
    
    if (items.length > 10) {
      result += `... 还有 ${items.length - 10} 件\n`;
    }
    
    return result;
  } catch (error) {
    return `❌ 查询失败：${error.message}`;
  }
}

// Main handler
async function handleTelegramMessage(message) {
  const text = message.text || '';
  const hasPhoto = message.photo && message.photo.length > 0;
  const caption = message.caption || '';
  
  // Help command
  if (text === '帮助' || text === 'help' || text === '/help') {
    return `👋 Glimmer Closet 使用指南：

📸 上传衣服：
发送照片 + 文字描述（名称、分类、颜色、季节、场合）

🔍 查询衣服：
• "查看衣柜" - 显示所有
• "查看外套" - 按分类
• "查看黑色衣服" - 按颜色  
• "找春季衣服" - 按季节

编码格式：C-XXXXXX`;
  }
  
  // Query commands
  if (text.includes('查看') || text.includes('查找') || text.includes('找')) {
    return await queryClothes(text);
  }
  
  // Upload with photo
  if (hasPhoto || text) {
    const inputText = caption || text;
    const parsed = parseClothInput(inputText);
    
    if (!parsed) {
      return '❓ 请提供衣服名称，例如：\n黑色羊绒大衣\n分类：外套\n颜色：黑色\n季节：秋冬';
    }
    
    // Note: Image download would require Telegram bot token
    // For now, create without image or with placeholder
    const result = await uploadCloth(parsed);
    return result.message;
  }
  
  return '👋 你好！发送 "帮助" 查看使用指南。';
}

// Export for use
module.exports = { handleTelegramMessage, parseClothInput, uploadCloth, queryClothes };

// CLI usage
if (require.main === module) {
  const text = process.argv[2];
  if (text) {
    handleTelegramMessage({ text }).then(console.log);
  } else {
    console.log('Usage: node telegram-handler.js "衣服描述"');
  }
}
