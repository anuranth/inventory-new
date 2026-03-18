import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  BrainCircuit,
  CloudRain,
  MapPin,
  Loader2,
  PackageSearch,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import StatCard from "./StatCard";

const API_BASE = "http://localhost:5001/api";
const FORECAST_DAYS = 14;
const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast";
const ALERT_STORAGE_KEY = "smart-inventory-weather-alert";

function getStock(product) {
  return product.stocks?.reduce((sum, entry) => sum + entry.quantity, 0) || 0;
}

function getDailyDemand(totalSold, salesCount) {
  const denominator = Math.max(salesCount, 7);
  return totalSold / denominator;
}

export default function AIInsights() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanText, setScanText] = useState("");
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productRes, salesRes] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/sales`),
        ]);

        const productData = productRes.ok ? await productRes.json() : [];
        const salesData = salesRes.ok ? await salesRes.json() : [];

        setProducts(productData);
        setSales(salesData);
      } catch (error) {
        console.error("AI insights load failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    refreshWeatherAlert();
  }, []);

  useEffect(() => {
    if (!weatherAlert || notificationPermission !== "granted" || typeof Notification === "undefined") {
      return;
    }

    const lastSignature = localStorage.getItem(ALERT_STORAGE_KEY);
    if (lastSignature === weatherAlert.signature) {
      return;
    }

    new Notification("Smart Inventory Weather Alert", {
      body: `${weatherAlert.title}: ${weatherAlert.message}`,
    });
    localStorage.setItem(ALERT_STORAGE_KEY, weatherAlert.signature);
  }, [weatherAlert, notificationPermission]);

  const requestNotificationAccess = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const fetchWeather = async (latitude, longitude) => {
    const url =
      `${WEATHER_API_BASE}?latitude=${latitude}&longitude=${longitude}` +
      "&current=temperature_2m,precipitation,rain,weather_code" +
      "&daily=precipitation_probability_max,temperature_2m_max" +
      "&timezone=auto&forecast_days=1";

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to load weather forecast");
    }

    return response.json();
  };

  const buildWeatherAlert = (weatherData) => {
    const rainAmount = Number(weatherData.current?.rain || 0);
    const precipitation = Number(weatherData.current?.precipitation || 0);
    const rainProbability = Number(weatherData.daily?.precipitation_probability_max?.[0] || 0);
    const maxTemperature = Number(weatherData.daily?.temperature_2m_max?.[0] || weatherData.current?.temperature_2m || 0);

    if (rainProbability >= 55 || rainAmount > 0 || precipitation > 0.5) {
      return {
        level: "high",
        title: "Rain alert",
        message: "Rain is likely soon. Increase stock for umbrellas, raincoats, and waterproof covers.",
        products: ["Umbrella", "Raincoat", "Waterproof Bag Cover"],
        signature: `rain-${rainProbability}-${rainAmount}-${precipitation}`,
      };
    }

    if (maxTemperature >= 34) {
      return {
        level: "medium",
        title: "Heat alert",
        message: "High temperature expected. Increase cold drinks, water bottles, and cooling essentials.",
        products: ["Cold Drinks", "Water Bottle", "Cooling Towels"],
        signature: `heat-${maxTemperature}`,
      };
    }

    return {
      level: "low",
      title: "Stable weather",
      message: "No urgent climate-based stock increase is needed right now.",
      products: ["Regular restocking only"],
      signature: `stable-${maxTemperature}-${rainProbability}`,
    };
  };

  const refreshWeatherAlert = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setWeatherError("Geolocation is not available on this device.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeather(position.coords.latitude, position.coords.longitude);
          const nextAlert = buildWeatherAlert(data);

          setWeatherAlert({
            ...nextAlert,
            location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`,
            checkedAt: new Date().toLocaleString(),
          });
        } catch (error) {
          console.error("Weather alert failed:", error);
          setWeatherError("Unable to fetch live weather data right now.");
        } finally {
          setWeatherLoading(false);
        }
      },
      () => {
        setWeatherError("Location access was denied, so live weather alerts are unavailable.");
        setWeatherLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const insights = useMemo(() => {
    const productSalesMap = new Map();

    sales.forEach((sale) => {
      const key = sale.productId;
      const current = productSalesMap.get(key) || {
        totalSold: 0,
        totalRevenue: 0,
        salesCount: 0,
        hourlyBuckets: Array(24).fill(0),
        weekdayBuckets: Array(7).fill(0),
      };

      const saleDate = new Date(sale.date);
      current.totalSold += Number(sale.quantity) || 0;
      current.totalRevenue += (Number(sale.quantity) || 0) * (Number(sale.price) || 0);
      current.salesCount += 1;
      current.hourlyBuckets[saleDate.getHours()] += Number(sale.quantity) || 0;
      current.weekdayBuckets[saleDate.getDay()] += Number(sale.quantity) || 0;

      productSalesMap.set(key, current);
    });

    const forecastRows = products.map((product) => {
      const stock = getStock(product);
      const salesMeta = productSalesMap.get(product.product_id) || {
        totalSold: 0,
        totalRevenue: 0,
        salesCount: 0,
      };

      const dailyDemand = getDailyDemand(salesMeta.totalSold, salesMeta.salesCount);
      const forecastDemand = Math.ceil(dailyDemand * FORECAST_DAYS);
      const suggestedStock = Math.max(12, Math.ceil(forecastDemand * 1.2));
      const reorderQty = Math.max(0, suggestedStock - stock);
      const stockStatus =
        stock === 0 ? "Out of stock" : stock < forecastDemand ? "Risk of shortage" : "Healthy";

      let suggestedPrice = Number(product.price) || 0;
      let pricingReason = "Keep current price";

      if (dailyDemand > 3 && stock < Math.max(8, forecastDemand / 2)) {
        suggestedPrice = Math.ceil(suggestedPrice * 1.08);
        pricingReason = "High demand with tight stock";
      } else if (stock > suggestedStock * 1.5) {
        suggestedPrice = Math.max(1, Math.floor(suggestedPrice * 0.95));
        pricingReason = "Slow movement with extra stock";
      }

      return {
        id: product.product_id,
        name: product.product_name,
        category: product.category?.category_name || "Uncategorized",
        stock,
        currentPrice: Number(product.price) || 0,
        totalSold: salesMeta.totalSold,
        forecastDemand,
        suggestedStock,
        reorderQty,
        stockStatus,
        suggestedPrice,
        pricingReason,
      };
    });

    const topForecasts = [...forecastRows]
      .sort((a, b) => b.forecastDemand - a.forecastDemand)
      .slice(0, 5);

    const restockAlerts = forecastRows.filter((item) => item.reorderQty > 0).slice(0, 5);

    const peakHourBucket = Array(24).fill(0);
    const weekdayBucket = Array(7).fill(0);

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      peakHourBucket[saleDate.getHours()] += Number(sale.quantity) || 0;
      weekdayBucket[saleDate.getDay()] += Number(sale.quantity) || 0;
    });

    const peakHour = peakHourBucket.indexOf(Math.max(...peakHourBucket));
    const peakDayIndex = weekdayBucket.indexOf(Math.max(...weekdayBucket));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const peakDay = dayNames[peakDayIndex] || "Monday";

    const recognitionMatches = products
      .filter((product) => {
        if (!scanText.trim()) return false;
        const haystack = `${product.product_name} ${product.category?.category_name || ""}`.toLowerCase();
        return haystack.includes(scanText.toLowerCase());
      })
      .slice(0, 5);

    return {
      forecastRows,
      topForecasts,
      restockAlerts,
      peakHour,
      peakDay,
      recognitionMatches,
      totalForecastUnits: forecastRows.reduce((sum, item) => sum + item.forecastDemand, 0),
      dynamicPriceChanges: forecastRows.filter((item) => item.currentPrice !== item.suggestedPrice).length,
    };
  }, [products, sales, scanText]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
              <BrainCircuit size={16} />
              AI-powered business decisions
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-sm text-blue-100 md:text-base">
              This module adds AI demand forecasting, dynamic pricing, customer pattern prediction,
              product recognition, storage AI, and weather-based stock alerts to your Smart Inventory project.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Forecast horizon</p>
              <p className="mt-2 text-2xl font-bold">{FORECAST_DAYS} days</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Products analyzed</p>
              <p className="mt-2 text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Forecast Units" value={insights.totalForecastUnits} icon={TrendingUp} color="blue" />
        <StatCard title="Price Suggestions" value={insights.dynamicPriceChanges} icon={Tags} color="orange" />
        <StatCard title="Restock Alerts" value={insights.restockAlerts.length} icon={Warehouse} color="red" />
      </div>

      <section className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-800">
              <BellRing size={18} />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Live Weather Notification</p>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {weatherAlert?.title || "Checking local weather conditions..."}
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              {weatherAlert?.message || "The system can send a real alert when rain or heat conditions affect stock planning."}
            </p>
            {weatherAlert?.checkedAt && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {weatherAlert.location}
                </span>
                <span>Checked at {weatherAlert.checkedAt}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshWeatherAlert}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={16} className={weatherLoading ? "animate-spin" : ""} />
              Refresh Alert
            </button>
            <button
              type="button"
              onClick={requestNotificationAccess}
              disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Bell size={16} />
              {notificationPermission === "granted"
                ? "Notifications Enabled"
                : notificationPermission === "unsupported"
                  ? "Browser Notifications Unsupported"
                  : "Enable Notifications"}
            </button>
          </div>
        </div>

        {weatherError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {weatherError}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Demand Forecasting</h2>
              <p className="text-sm text-gray-500">Predicts future product demand from past sales history.</p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.topForecasts.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {item.stockStatus}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Current stock</p>
                    <p className="font-semibold text-gray-800">{item.stock}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Forecast demand</p>
                    <p className="font-semibold text-gray-800">{item.forecastDemand}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Suggested stock</p>
                    <p className="font-semibold text-gray-800">{item.suggestedStock}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Tags size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dynamic Pricing</h2>
              <p className="text-sm text-gray-500">Suggests price changes based on stock pressure and movement.</p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.forecastRows.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.pricingReason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: Rs. {item.currentPrice}</p>
                  <p className="font-bold text-orange-600">AI: Rs. {item.suggestedPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer Pattern Prediction</h2>
              <p className="text-sm text-gray-500">Finds busy shopping periods and customer purchase behavior.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Peak shopping day</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{insights.peakDay}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Peak shopping hour</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {String(insights.peakHour).padStart(2, "0")}:00
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The system studies sales timing patterns and helps the shop owner prepare staff, billing counters,
            and high-demand products during busy periods.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <ScanSearch size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Product Recognition</h2>
              <p className="text-sm text-gray-500">Matches typed label or scanned text to available products.</p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={scanText}
              onChange={(event) => setScanText(event.target.value)}
              placeholder="Type a label like umbrella, soap, rice..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            {scanText.trim() ? (
              insights.recognitionMatches.length > 0 ? (
                <div className="space-y-2">
                  {insights.recognitionMatches.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                          <PackageSearch size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.category?.category_name || "Uncategorized"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">Stock {getStock(product)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
                  No close match found. This can be extended with barcode or image recognition later.
                </div>
              )
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
                Enter a product keyword to simulate AI-based product recognition.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <Warehouse size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Storage AI</h2>
              <p className="text-sm text-gray-500">Suggests stock levels, storage priority, and restocking actions.</p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.restockAlerts.length > 0 ? (
              insights.restockAlerts.map((item) => (
                <div key={item.id} className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        Store fast-moving items near billing and dispatch zones.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                      Restock {item.reorderQty}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">
                Current stock levels are healthy for the analyzed period.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
              <CloudRain size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weather-based AI Alerts</h2>
              <p className="text-sm text-gray-500">Creates live weather alerts and sends stock notifications for climate-driven demand.</p>
            </div>
          </div>

          {weatherAlert ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center gap-2 text-sky-900">
                  <Sparkles size={16} />
                  <p className="font-semibold">{weatherAlert.title}</p>
                </div>
                <p className="mt-2 text-sm text-sky-800">{weatherAlert.message}</p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-900">Recommended stock action</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  {weatherAlert.products.map((product) => (
                    <li key={product} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Increase stock for {product}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
              Use the refresh button above to generate a live weather-based stock alert.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
