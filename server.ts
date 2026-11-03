import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {aiPrompt,localDay,validDay,normalizeAiResponse,parseVietnameseFinancialCommand,nonPostingReason,isAiQuery} from './src/services/aiFinancial';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// One shared parser and response boundary for web, custom backend and Android.
app.post('/api/chat', async (req, res) => {
  const {message,accounts,categories,categoryDetails,localDate}=req.body || {};
  const names=(value:unknown):value is string[]=>Array.isArray(value)&&value.length<=500&&value.every(x=>typeof x==='string'&&x.length>0&&x.length<=200);
  if(typeof message!=='string'||!message.trim()||message.length>4000||!names(accounts)||!names(categories))return res.status(400).json({error:'Nội dung không hợp lệ'});
  const accountRefs=accounts.map((name:string)=>({name}));
  const categoryRefs=categories.map((name:string)=>({name,type:Array.isArray(categoryDetails)?categoryDetails.find((c:any)=>c?.name===name&&['income','expense','lend'].includes(c.type))?.type:undefined}));
  const today=typeof localDate==='string'&&validDay(localDate)?localDate:localDay();
  const now=new Date(today+'T12:00:00');
  const normalize=(raw:unknown)=>normalizeAiResponse(raw,message,accountRefs,categoryRefs,now);
  if(nonPostingReason(message)||isAiQuery(message))return res.json(parseVietnameseFinancialCommand(message,accounts,categories,now));
  if(process.env.GEMINI_API_KEY)try{
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const response=await ai.models.generateContent({model:'gemini-2.5-flash',contents:message,config:{systemInstruction:aiPrompt(accountRefs,categoryRefs,today),responseMimeType:'application/json',temperature:0,httpOptions:{timeout:12000}}});
    const output=response.text||'';if(output.length>100000)throw new Error('Oversized response');
    return res.json(normalize(JSON.parse(output)));
  }catch{/* Do not log financial text or keys. */}
  return res.json(normalize(parseVietnameseFinancialCommand(message,accounts,categories,now)));
});

import http from 'http';

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`[LTMsav] Server running at http://${HOST}:${PORT}`);
  });
}

startServer();
