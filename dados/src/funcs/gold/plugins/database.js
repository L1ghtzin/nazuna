const fs = require('fs');

async function SaveJson(locate, json) {
  try {
    const FileText = JSON.stringify(json, null, 2);
    await fs.writeFileSync(locate, FileText);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  };
};

async function LoadJson(locate) {
  try {
    const FileText = await fs.readFileSync(locate, 'utf-8');
    const FileJson = JSON.parse(FileText);
    return FileJson;
  } catch(e) {
    console.error(e);
    return false;
  };
};