const bcrypt = require('bcrypt');

async function generatePasswordHash() {
    const passwords = [
        { name: 'admin', password: '580602' },
        { name: 'atwood/teacher/manager', password: '123456' }
    ];

    console.log('正在生成密碼哈希...\n');

    for (const item of passwords) {
        const hash = await bcrypt.hash(item.password, 12);
        console.log(`${item.name}:`);
        console.log(`  原密碼: ${item.password}`);
        console.log(`  哈希值: ${hash}\n`);
    }
}

generatePasswordHash().catch(console.error); 