/**
 * Busca de letras de música
 * Otimizado com HTTP connection pooling
 */

import { scrapingClient } from '../../utils/httpClient.js';
import { parseHTML } from 'linkedom';

async function getLyrics(topic) {
  try {
    // Realistic headers to bypass Cloudflare
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.letras.mus.br/',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1'
    };

    // Search request
    const response = await scrapingClient.get(`https://solr.sscdn.co/letras/m1/?q=${encodeURIComponent(topic)}&wt=json&callback=LetrasSug`, { headers });
    
    if (response.status !== 200) {
      throw new Error('Erro ao buscar letra da música');
    }

    // Parse JSONP response
    const jsonData = response.data.replace('LetrasSug(', '').replace(')\n', '');
    const parsedData = JSON.parse(jsonData);

    if (!parsedData?.response?.docs?.length) {
      throw new Error('Letra não encontrada');
    }

    const lyric = parsedData.response.docs[0];
    if (!lyric?.dns || !lyric?.url) {
      throw new Error('Letra não encontrada');
    }

    // Fetch lyrics page
    const lyricUrl = `https://www.letras.mus.br/${lyric.dns}/${lyric.url}`;
    const lyricResponse = await scrapingClient.get(lyricUrl, { headers });

    if (lyricResponse.status !== 200) {
      throw new Error('Sem resposta do servidor');
    }

    // Parse HTML with linkedom
    const { document } = parseHTML(lyricResponse.data);

    // Extract metadata
    const title = document.querySelector('h1')?.textContent || 'Título não disponível';
    const artist = document.querySelector('h2.textStyle-secondary')?.textContent || 'Artista não disponível';

    // Extract lyrics
    const lyricElements = document.querySelectorAll('.lyric-original > p');

    if (!lyricElements.length) {
      throw new Error('Letra não encontrada');
    }

    // Process lyrics, preserving stanzas
    const lyricsText = Array.from(lyricElements).map(p => {
      const spans = p.querySelectorAll('span.verse');
      
      if (spans.length) {
        // Handle romanization (e.g., for songs with alternate scripts)
        return Array.from(spans)
          .map(span => span.querySelector('span.romanization')?.textContent || '')
          .filter(line => line)
          .join('\n');
      }
      
      // Split lines within a stanza and filter out empty lines
      return p.innerHTML.split('<br>')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
    }).filter(stanza => stanza); // Filter out empty stanzas

    // Format output with metadata and lyrics, separating stanzas with double line breaks
    const formattedOutput = `
🎵 *${title.replaceAll('\n', '').replaceAll('  ', '')}* 🎵
Artista: ${artist.replaceAll('\n', '').replaceAll('  ', '')}
URL: ${lyricUrl}

📜 *Letra*:
${lyricsText.join('\n\n')}
    `.trim();

    return formattedOutput;

  } catch (error) {
    throw new Error(`Erro: ${error.message}`);
  }
}

export default getLyrics;