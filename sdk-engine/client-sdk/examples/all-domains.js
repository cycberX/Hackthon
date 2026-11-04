/**
 * Comprehensive OneAPI SDK Demo
 * Demonstrates calling all 5 domains with automatic failover and telemetry capture.
 */
import { OneAPI } from '../src/index.js';

async function runDemo() {
  console.log('====================================================');
  console.log('🚀 OneAPI Gateway Unified SDK Full-Domain Showcase');
  console.log('====================================================\n');

  const oneapi = new OneAPI({
    apiKey: process.env.ONEAPI_API_KEY || 'sk_live_demo_developer_key',
    baseURL: process.env.ONEAPI_BASE_URL || 'http://localhost:5000/api/v1',
  });

  // 1. Health Check
  console.log('1️⃣ Checking OneAPI Gateway Health...');
  try {
    const health = await oneapi.health.check();
    console.log(`   Status: ${health.status} (Uptime: ${Math.round(health.uptime || 0)}s)`);
  } catch (err) {
    console.log(`   Health check warning: ${err.message}`);
  }

  // 2. Providers Catalog
  console.log('\n2️⃣ Querying Multi-Category Provider Registry...');
  try {
    const providers = await oneapi.providers.list();
    console.log(`   Total Registered Providers: ${providers.totalRegistered || providers.categories?.length}`);
    if (providers.categories) {
      for (const cat of providers.categories) {
        const names = cat.registeredProviders?.map((p) => p.displayName).join(', ');
        console.log(`   • ${cat.category.toUpperCase()}: [${names}]`);
      }
    }
  } catch (err) {
    console.log(`   Providers catalog error: ${err.message}`);
  }

  // 3. AI Chat Proxy
  console.log('\n3️⃣ Testing AI Chat with Priority Failover Cascade...');
  try {
    const chat = await oneapi.ai.chat({
      prompt: 'Explain what an API Gateway failover matrix is in 1 concise sentence.',
      temperature: 0.7,
    });
    console.log(`   Response: "${chat.content}"`);
    console.log(`   Provider: ${chat.providerUsed} (Fallback: ${chat.usedFallback ? 'Yes' : 'No'}, Latency: ${chat.latencyMs}ms)`);
  } catch (err) {
    console.log(`   AI Chat note: ${err.message}`);
  }

  // 4. Weather Proxy
  console.log('\n4️⃣ Testing Weather Service (Open-Meteo & Weatherstack)...');
  try {
    const weather = await oneapi.weather.current({ city: 'San Francisco' });
    console.log(`   Location: ${weather.location}`);
    console.log(`   Condition: ${weather.current?.condition}, Temp: ${weather.current?.temperature}°C, Humidity: ${weather.current?.humidity}%`);
    console.log(`   Telemetry: Provider=${weather.provider}, Latency=${weather._oneapi?.latencyMs}ms`);
  } catch (err) {
    console.log(`   Weather error: ${err.message}`);
  }

  // 5. Music Proxy
  console.log('\n5️⃣ Testing Music Catalog (Deezer & Apple iTunes)...');
  try {
    const music = await oneapi.music.search({ query: 'Daft Punk', limit: 3 });
    console.log(`   Found ${music.total} tracks. Top 3:`);
    for (const t of music.tracks.slice(0, 3)) {
      console.log(`   • "${t.title}" by ${t.artist} (${t.durationFormatted})`);
    }
    console.log(`   Telemetry: Provider=${music.provider}, Latency=${music._oneapi?.latencyMs}ms`);
  } catch (err) {
    console.log(`   Music error: ${err.message}`);
  }

  // 6. News Proxy
  console.log('\n6️⃣ Testing News Radar (HackerNews & Spaceflight News)...');
  try {
    const news = await oneapi.news.search({ query: 'technology', limit: 3 });
    console.log(`   Found ${news.total} articles. Top headlines:`);
    for (const a of news.articles.slice(0, 3)) {
      console.log(`   • "${a.title}" [${a.source}]`);
    }
    console.log(`   Telemetry: Provider=${news.provider}, Latency=${news._oneapi?.latencyMs}ms`);
  } catch (err) {
    console.log(`   News error: ${err.message}`);
  }

  // 7. Environment Proxy
  console.log('\n7️⃣ Testing Air Quality Monitor (OpenAQ & Open-Meteo Air)...');
  try {
    const env = await oneapi.environment.airQuality({ city: 'London' });
    console.log(`   Location: ${env.location}`);
    console.log(`   US AQI: ${env.airQuality?.aqi} (${env.airQuality?.status}) | PM2.5: ${env.airQuality?.pm25} µg/m³`);
    console.log(`   Telemetry: Provider=${env.provider}, Latency=${env._oneapi?.latencyMs}ms`);
  } catch (err) {
    console.log(`   Environment error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log('✅ OneAPI SDK Demonstration Finished Successfully!');
  console.log('====================================================');
}

runDemo();
