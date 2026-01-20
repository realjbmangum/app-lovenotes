#!/usr/bin/env node
/**
 * Generate additional love messages for all themes
 * Run with: node scripts/generate-more-messages.js
 */

const fs = require('fs');
const path = require('path');

// Templates for each theme - we'll interpolate these
const romanticTemplates = [
  "Every moment with you feels like a beautiful dream, {wife_name}.",
  "You make my heart skip a beat every single day, {wife_name}.",
  "I fall more in love with you with each passing moment.",
  "Your smile is the highlight of my entire day, {wife_name}.",
  "Being married to you is the greatest adventure of my life.",
  "I can't imagine my life without your love, {wife_name}.",
  "You are the most beautiful person I've ever known, inside and out.",
  "My love for you grows stronger every single day.",
  "You complete me in ways I never knew I needed, {wife_name}.",
  "Every love song makes me think of you.",
  "I'm so grateful that I get to call you my wife.",
  "Your love is the best thing that's ever happened to me.",
  "I cherish every moment we spend together, {wife_name}.",
  "You make ordinary days feel extraordinary.",
  "My heart belongs to you, now and forever.",
  "Being with you feels like coming home, {wife_name}.",
  "You are my best friend and my soulmate.",
  "I love the way your eyes light up when you laugh.",
  "Every day with you is better than the last.",
  "You are the answer to every prayer I've ever said.",
  "I'm blessed beyond measure to have you in my life.",
  "Your love gives me strength to face anything.",
  "I never knew love could feel this amazing until I met you.",
  "You are my forever and always, {wife_name}.",
  "My favorite place is right beside you.",
  "You make me want to be a better man every day.",
  "I'm counting down the minutes until I see you again.",
  "Your love is the greatest gift I've ever received.",
  "I fall in love with you all over again every morning.",
  "You are my sunshine on the cloudiest days.",
  "Nothing compares to the joy you bring to my life.",
  "I would choose you in every lifetime, {wife_name}.",
  "Your kindness and grace inspire me daily.",
  "I'm so lucky to wake up next to you every day.",
  "You make everything better just by being you.",
  "My love for you is endless and unconditional.",
  "You are the missing piece I never knew I needed.",
  "Every day with you is a gift I'll never take for granted.",
  "I love you more than words could ever express.",
  "You are my heart, my soul, my everything.",
];

const funnyTemplates = [
  "I love you more than pizza, and that's saying something, {wife_name}!",
  "You're the WiFi to my laptop - I can't function without you!",
  "Marriage tip: I'm always wrong, and I'm totally fine with that.",
  "You're the reason I smile... and also the reason I need coffee.",
  "I love you even when you steal all the blankets, {wife_name}.",
  "You're my favorite weirdo, and I wouldn't have it any other way!",
  "Thanks for putting up with me. I know I'm a lot!",
  "You're the cheese to my macaroni - we're better together!",
  "I love you more than Netflix, and that's a BIG deal.",
  "You had me at 'I'll cook dinner tonight.'",
  "Marriage is just texting 'What do you want for dinner?' until we die.",
  "You're my favorite notification on my phone, {wife_name}!",
  "I promise to always let you have the last slice of pizza... maybe.",
  "You're stuck with me forever. Sorry, no refunds!",
  "I love you even when you're hangry.",
  "You complete me... especially my sentences.",
  "Thanks for laughing at my jokes even when they're terrible.",
  "I'd share my fries with you, and that's true love.",
  "You're the avocado to my toast - expensive but totally worth it!",
  "I love you more than I love sleeping in, {wife_name}.",
  "You're my favorite human to be weird with.",
  "Marriage is just asking each other 'did you hear that noise?' forever.",
  "I'd let you have the TV remote. Sometimes.",
  "You're the only person I'd share my snacks with, {wife_name}.",
  "Thanks for pretending my dad jokes are funny!",
  "I love you more than my phone battery loves dying at 20%.",
  "You're my emergency contact and my emergency snack supplier.",
  "Marriage: because who else would put up with this?",
  "You make my heart do that thing hearts do. You know, beat.",
  "I'd pause my video game for you. That's love.",
  "You're the reason I smile and the reason I have gray hairs!",
  "Thanks for choosing me when you could have had literally anyone else.",
  "I love you like a fat kid loves cake. Wait, I'm the fat kid.",
  "You're my favorite hello and my hardest goodbye, {wife_name}.",
  "If loving you was a crime, I'd be serving a life sentence.",
  "You're the only person who knows how weird I really am.",
  "I'd share my dessert with you. THAT'S how much I love you.",
  "You had me at 'I made extra food.'",
  "Thanks for being my partner in crime and in naps.",
  "You're my lobster, {wife_name}! Did you get that reference?",
];

const appreciativeTemplates = [
  "Thank you for everything you do for our family, {wife_name}.",
  "I notice and appreciate all the little things you do every day.",
  "Your hard work and dedication inspire me constantly.",
  "Thank you for making our house a home, {wife_name}.",
  "I'm so grateful for your patience and understanding.",
  "You amaze me with how much you give to everyone around you.",
  "Thank you for always believing in me, even when I don't.",
  "I appreciate your strength and resilience so much.",
  "You work so hard, and I see everything you do.",
  "Thank you for being my partner in this beautiful life.",
  "I'm grateful for your love and support every single day.",
  "You make our family stronger just by being you, {wife_name}.",
  "Thank you for all the sacrifices you make for us.",
  "I appreciate how you always put others first.",
  "Your kindness to everyone around you is truly inspiring.",
  "Thank you for making me a better person, {wife_name}.",
  "I notice how hard you work and I appreciate you so much.",
  "You bring so much joy and warmth to everyone you meet.",
  "Thank you for your endless love and compassion.",
  "I'm grateful for every moment we share together.",
  "Your dedication to our family is truly remarkable.",
  "Thank you for being my rock through everything.",
  "I appreciate your wisdom and guidance in my life.",
  "You work harder than anyone I know, {wife_name}.",
  "Thank you for filling our home with love and laughter.",
  "I'm so grateful for your caring and nurturing spirit.",
  "You make everyone around you feel loved and valued.",
  "Thank you for being my partner, my friend, my everything.",
  "I appreciate your thoughtfulness in everything you do.",
  "Your love and devotion mean the world to me, {wife_name}.",
  "Thank you for always being there when I need you.",
  "I'm grateful for your beautiful heart and soul.",
  "You give so much of yourself to others every day.",
  "Thank you for making our life together so wonderful.",
  "I appreciate you more than you could ever know.",
  "Your selflessness and generosity inspire me daily.",
  "Thank you for loving me unconditionally, {wife_name}.",
  "I'm so grateful to have you as my wife.",
  "You make everything better just by being present.",
  "Thank you for being the amazing woman you are.",
];

const encouragingTemplates = [
  "You've got this, {wife_name}! I believe in you completely.",
  "Remember how strong you are - you can handle anything!",
  "I'm so proud of everything you've accomplished.",
  "Whatever you're facing today, I know you'll overcome it.",
  "Your determination and courage inspire me every day.",
  "You are capable of amazing things, {wife_name}!",
  "Don't forget how incredible you truly are.",
  "I'm your biggest cheerleader, today and always.",
  "You have overcome so much - this is nothing for you!",
  "Your strength and resilience amaze me constantly.",
  "Believe in yourself as much as I believe in you, {wife_name}.",
  "You're doing an amazing job, even when it doesn't feel like it.",
  "I'm so proud to be married to such a strong woman.",
  "Whatever challenge you face, we face it together.",
  "You have everything it takes to succeed.",
  "I see your potential, and it's limitless, {wife_name}!",
  "Keep going - you're closer to your goals than you think.",
  "Your hard work will pay off. I know it will.",
  "You inspire everyone around you with your dedication.",
  "Remember: you are braver than you believe.",
  "I'm here cheering you on every step of the way.",
  "You handle everything with such grace and poise.",
  "Your perseverance is truly remarkable, {wife_name}.",
  "Don't give up - you're doing better than you think!",
  "I'm so proud of the woman you are and who you're becoming.",
  "You can do hard things. You've proven that time and again.",
  "Whatever today brings, I know you'll handle it beautifully.",
  "Your courage in facing challenges inspires me.",
  "Keep shining, {wife_name} - the world needs your light!",
  "I believe in your dreams as much as you do.",
  "You are making a difference, even when you can't see it.",
  "Stay strong - better days are coming.",
  "Your positive attitude is contagious and inspiring.",
  "I'm so proud of how far you've come, {wife_name}.",
  "You deserve all the success that's coming your way.",
  "Keep pushing forward - you're almost there!",
  "Your strength amazes me more every day.",
  "I know you'll achieve great things, because you always do.",
  "You handle pressure with such grace, {wife_name}.",
  "Remember: I'm always in your corner, cheering you on!",
];

// Variation starters and enders to create unique messages
const starters = [
  "Good morning, {wife_name}! ",
  "Hey beautiful, ",
  "Just wanted you to know that ",
  "Thinking of you and ",
  "Quick reminder: ",
  "I was just thinking... ",
  "Hope you're having a great day! ",
  "Sending you love because ",
  "Just a note to say ",
  "{wife_name}, ",
  "My love, ",
  "Sweetheart, ",
  "Hey {wife_name}, ",
  "Just because I can: ",
  "Random thought: ",
  "",  // no starter
];

const enders = [
  " Love you!",
  " Have a wonderful day!",
  " You're amazing!",
  " Miss you!",
  " Can't wait to see you later!",
  " XOXO",
  " You make me so happy!",
  " Forever yours.",
  " Thinking of you always.",
  " You're the best!",
  "",  // no ender
];

function generateMessages(templates, theme, startId, count) {
  const messages = [];
  let id = startId;

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const starter = starters[Math.floor(Math.random() * starters.length)];
    const ender = enders[Math.floor(Math.random() * enders.length)];

    // Create variation
    let content = starter + template + ender;

    // Clean up double spaces and {wife_name} duplication
    content = content.replace(/\s+/g, ' ').trim();

    messages.push({
      id: id++,
      theme,
      content
    });
  }

  return messages;
}

function generateOccasionMessages(startId) {
  const occasions = {
    anniversary: [
      "Happy Anniversary, {wife_name}! Another year of loving you has been the greatest gift.",
      "On this special day, I want you to know that marrying you was the best decision I ever made.",
      "Happy Anniversary! Every year with you is better than the last, {wife_name}.",
      "Celebrating another year of us today. I love you more than ever!",
      "Happy Anniversary, my love! Here's to many more years of happiness together.",
      "Today marks another year of the most beautiful journey of my life - being your husband.",
      "Happy Anniversary, {wife_name}! You still give me butterflies after all this time.",
      "Another year, another reason to be grateful for you. Happy Anniversary!",
      "Celebrating the day I promised to love you forever. And I meant every word.",
      "Happy Anniversary! I'd choose you all over again in a heartbeat, {wife_name}.",
    ],
    birthday: [
      "Happy Birthday to the most amazing woman I know! Make today special, {wife_name}!",
      "It's your special day, {wife_name}! I hope this year brings you everything you deserve.",
      "Happy Birthday, my love! The world is better because you're in it.",
      "Wishing the happiest of birthdays to my beautiful wife. I love you!",
      "Happy Birthday, {wife_name}! May all your dreams come true this year.",
      "Today we celebrate you! Happy Birthday to my favorite person.",
      "Another year of you means another year of blessings for me. Happy Birthday!",
      "Happy Birthday to my best friend and soulmate. Enjoy every moment today!",
      "It's your day, {wife_name}! Let me spoil you like you deserve.",
      "Happy Birthday! You only get more amazing with each passing year.",
    ],
    valentines: [
      "Happy Valentine's Day, {wife_name}! You're the love of my life, today and always.",
      "On this day of love, I want you to know you mean everything to me.",
      "Happy Valentine's Day! Every day with you feels like Valentine's Day to me.",
      "To my forever Valentine: I love you more than words can say, {wife_name}.",
      "Happy Valentine's Day! Thank you for filling my life with love.",
      "You're not just my Valentine - you're my everything. Happy Valentine's Day!",
      "Sending all my love to you today and every day. Happy Valentine's Day, {wife_name}!",
      "Happy Valentine's Day to the woman who stole my heart and keeps it safe.",
      "Every love song, every romantic movie - they all remind me of you. Happy Valentine's Day!",
      "You make every day feel special. Happy Valentine's Day, my love!",
    ],
    mothers_day: [
      "Happy Mother's Day to the most incredible mom and wife! We're so blessed, {wife_name}.",
      "Thank you for being such an amazing mother. Happy Mother's Day!",
      "Watching you be a mom is the most beautiful thing. Happy Mother's Day, {wife_name}!",
      "You give so much to our family. Today is all about celebrating you!",
      "Happy Mother's Day! The kids are lucky to have you, and so am I.",
      "Your love and dedication as a mother inspire me every day. Happy Mother's Day!",
      "To the heart of our family: Happy Mother's Day, {wife_name}!",
      "Happy Mother's Day to the woman who makes our house a home.",
      "Thank you for the sacrifices you make for our family. You're an amazing mom!",
      "Happy Mother's Day! Our family is blessed because of your love.",
    ],
    christmas: [
      "Merry Christmas, {wife_name}! You're the best gift I've ever received.",
      "Wishing you a Christmas as wonderful as you are, my love!",
      "Merry Christmas! I'm so grateful to spend this season with you.",
      "You make the holidays magical, {wife_name}. Merry Christmas!",
      "All I want for Christmas is you. Merry Christmas, my love!",
      "Merry Christmas to the love of my life! May this season bring you joy.",
      "Spending Christmas with you is the greatest gift. Merry Christmas, {wife_name}!",
      "Merry Christmas! Thank you for making every holiday special.",
      "You are my favorite part of every Christmas. Love you, {wife_name}!",
      "Merry Christmas to my wife, my best friend, my everything.",
    ],
    thanksgiving: [
      "Happy Thanksgiving, {wife_name}! I'm most thankful for you.",
      "Today I'm counting my blessings, and you're at the top of the list.",
      "Happy Thanksgiving! Thank you for filling my life with love and joy.",
      "Grateful for you today and every day, {wife_name}.",
      "Happy Thanksgiving to the woman I'm most thankful for!",
      "You're the reason I have so much to be thankful for. Happy Thanksgiving!",
      "On this day of gratitude, I'm most grateful for your love, {wife_name}.",
      "Happy Thanksgiving! Our family is blessed because of you.",
      "Thankful for every moment with you. Happy Thanksgiving, my love!",
      "You make every day feel like Thanksgiving. I love you, {wife_name}!",
    ],
    new_years: [
      "Happy New Year, {wife_name}! I can't wait to see what this year brings us.",
      "Here's to another year of love and adventure together. Happy New Year!",
      "Happy New Year! My resolution is to love you even more this year.",
      "Starting the new year with you by my side is the best gift, {wife_name}.",
      "Happy New Year to my partner in everything! Love you!",
      "May this new year bring us even more happiness together. Happy New Year!",
      "Happy New Year, {wife_name}! Every year with you is a blessing.",
      "Cheers to us and another year of love. Happy New Year!",
      "Starting fresh with you is all I need. Happy New Year, my love!",
      "Happy New Year! I'm so excited for our next chapter together.",
    ],
    just_because: [
      "No special occasion - I just wanted you to know I love you, {wife_name}.",
      "This message is just because you're amazing and I wanted to remind you.",
      "No reason needed to tell you how much you mean to me.",
      "Just because I was thinking of you and wanted to send some love.",
      "Random reminder: You're wonderful and I'm lucky to have you, {wife_name}!",
      "This is your 'just because I love you' message of the day.",
      "No occasion, no reason - just love for you, {wife_name}.",
      "Sending this just because you deserve to feel loved today.",
      "Just wanted to brighten your day. I love you, {wife_name}!",
      "No special day needed to remind you how special you are to me.",
    ],
  };

  const messages = [];
  let id = startId;

  for (const [occasion, templates] of Object.entries(occasions)) {
    for (const content of templates) {
      messages.push({
        id: id++,
        theme: 'occasions',
        occasion,
        content
      });
    }
  }

  return messages;
}

// Generate messages
const romantic003 = generateMessages(romanticTemplates, 'romantic', 201, 200);
const romantic004 = generateMessages(romanticTemplates, 'romantic', 401, 200);
const romantic005 = generateMessages(romanticTemplates, 'romantic', 601, 200);

const funny002 = generateMessages(funnyTemplates, 'funny', 801, 150);
const funny003 = generateMessages(funnyTemplates, 'funny', 951, 150);

const appreciative002 = generateMessages(appreciativeTemplates, 'appreciative', 1101, 150);
const appreciative003 = generateMessages(appreciativeTemplates, 'appreciative', 1251, 150);

const encouraging002 = generateMessages(encouragingTemplates, 'encouraging', 1401, 150);
const encouraging003 = generateMessages(encouragingTemplates, 'encouraging', 1551, 150);

const moreOccasions = generateOccasionMessages(1701);

// Write files
const dataDir = path.join(__dirname, '..', 'data', 'messages');

fs.writeFileSync(path.join(dataDir, 'romantic-003.json'), JSON.stringify(romantic003, null, 2));
fs.writeFileSync(path.join(dataDir, 'romantic-004.json'), JSON.stringify(romantic004, null, 2));
fs.writeFileSync(path.join(dataDir, 'romantic-005.json'), JSON.stringify(romantic005, null, 2));
fs.writeFileSync(path.join(dataDir, 'funny-002.json'), JSON.stringify(funny002, null, 2));
fs.writeFileSync(path.join(dataDir, 'funny-003.json'), JSON.stringify(funny003, null, 2));
fs.writeFileSync(path.join(dataDir, 'appreciative-002.json'), JSON.stringify(appreciative002, null, 2));
fs.writeFileSync(path.join(dataDir, 'appreciative-003.json'), JSON.stringify(appreciative003, null, 2));
fs.writeFileSync(path.join(dataDir, 'encouraging-002.json'), JSON.stringify(encouraging002, null, 2));
fs.writeFileSync(path.join(dataDir, 'encouraging-003.json'), JSON.stringify(encouraging003, null, 2));
fs.writeFileSync(path.join(dataDir, 'occasions-002.json'), JSON.stringify(moreOccasions, null, 2));

console.log('Generated message files:');
console.log(`  romantic-003.json: ${romantic003.length} messages`);
console.log(`  romantic-004.json: ${romantic004.length} messages`);
console.log(`  romantic-005.json: ${romantic005.length} messages`);
console.log(`  funny-002.json: ${funny002.length} messages`);
console.log(`  funny-003.json: ${funny003.length} messages`);
console.log(`  appreciative-002.json: ${appreciative002.length} messages`);
console.log(`  appreciative-003.json: ${appreciative003.length} messages`);
console.log(`  encouraging-002.json: ${encouraging002.length} messages`);
console.log(`  encouraging-003.json: ${encouraging003.length} messages`);
console.log(`  occasions-002.json: ${moreOccasions.length} messages`);

const total = romantic003.length + romantic004.length + romantic005.length +
  funny002.length + funny003.length +
  appreciative002.length + appreciative003.length +
  encouraging002.length + encouraging003.length +
  moreOccasions.length;

console.log(`\nTotal new messages: ${total}`);
console.log(`Previous messages: 560`);
console.log(`Grand total: ${560 + total}`);
