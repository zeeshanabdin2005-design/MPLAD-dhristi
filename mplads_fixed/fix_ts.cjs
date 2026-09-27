const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
        for (const [key, value] of Object.entries(doc.fields)) {
          if (value.stringValue !== undefined) result[key] = value.stringValue;
          else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
          else if (value.doubleValue !== undefined) result[key] = Number(value.doubleValue);
          else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
          else if (value.arrayValue !== undefined) {
             result[key] = value.arrayValue.values ? value.arrayValue.values.map(v => v.stringValue || v.integerValue) : [];
          }
`;

const replacement = `
        for (const [key, val] of Object.entries(doc.fields)) {
          const value = val as any;
          if (value.stringValue !== undefined) result[key] = value.stringValue;
          else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
          else if (value.doubleValue !== undefined) result[key] = Number(value.doubleValue);
          else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
          else if (value.arrayValue !== undefined) {
             result[key] = value.arrayValue.values ? value.arrayValue.values.map((v: any) => v.stringValue || v.integerValue) : [];
          }
`;

code = code.replace(target, replacement);

const target2 = `const safeMlData = (req.body.mlData && req.body.mlData.constituency === projData?.constituency && req.body.mlData.year === projData?.financialYear) ? req.body.mlData : null;`;
const replacement2 = `const safeMlData = (req.body.mlData && req.body.mlData.constituency === (projData as any)?.constituency && req.body.mlData.year === (projData as any)?.financialYear) ? req.body.mlData : null;`;

code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
