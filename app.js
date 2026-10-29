const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/api/search', async (request, response) => {
  const query = request.query.q?.trim();

  if (!query) {
    return response.status(400).json({ error: 'Informe o nome de um astro.' });
  }

  try {
    const nasaUrl = new URL('https://images-api.nasa.gov/search');
    nasaUrl.searchParams.set('q', query);
    nasaUrl.searchParams.set('media_type', 'image');

    const nasaResponse = await fetch(nasaUrl);

    if (!nasaResponse.ok) {
      throw new Error(`NASA retornou status ${nasaResponse.status}`);
    }

    const data = await nasaResponse.json();
    const items = data.collection?.items ?? [];

    const results = items
      .filter((item) => {
        const metadata = item.data?.[0] ?? {};
        const rights = `${metadata.title ?? ''} ${metadata.description ?? ''}`.toLowerCase();
        return !rights.includes('copyright') && !rights.includes('rights reserved');
      })
      .map((item) => {
        const metadata = item.data?.[0] ?? {};
        const imageUrl = item.links?.[0]?.href;

        return {
          title: metadata.title ?? 'Imagem da NASA',
          description: metadata.description ?? '',
          imageUrl,
          date: metadata.date_created ?? ''
        };
      })
      .filter((item) => item.imageUrl)
      .slice(0, 12);

    response.json(results);
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Não foi possível consultar a NASA.' });
  }
});

app.listen(port, () => {
  console.log(`Carrossel disponível em http://localhost:${port}`);
});
