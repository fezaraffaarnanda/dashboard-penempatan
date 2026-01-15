"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import penempatanData from "@/data/penempatan.json";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-spinner"></div>
      <p>Memuat peta...</p>
    </div>
  ),
});

interface Penempatan {
  no: number;
  nama: string;
  jabatan: string;
  unitKerja: string;
  provinsi: string;
}

interface ModalData {
  province: string;
  people: Penempatan[];
}

// Simple hash function to obscure the password in code
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Pre-computed hash of the correct password
const VALID_HASH = "-ruwgmd"; // hash of "mie ayam"

// Session key for storage
const SESSION_KEY = "stis_auth_" + Date.now().toString(36).slice(-4);

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const provinceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Verify password with hash comparison
  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setLoginError("");

      // Add small delay to prevent brute force and make it feel more realistic
      setTimeout(() => {
        const inputHash = hashString(password.toLowerCase().trim());

        if (inputHash === VALID_HASH) {
          setIsAuthenticated(true);
          setPassword(""); // Clear password from memory
        } else {
          setLoginError("Password salah. Silakan coba lagi.");
          setPassword("");
        }
        setIsLoading(false);
      }, 500);
    },
    [password]
  );

  const provinceStats = useMemo(() => {
    const stats: { [key: string]: Penempatan[] } = {};
    (penempatanData as Penempatan[]).forEach((item) => {
      if (!stats[item.provinsi]) {
        stats[item.provinsi] = [];
      }
      stats[item.provinsi].push(item);
    });
    return stats;
  }, []);

  // Stats for map display - merge K/L/P and PUSAT into DKI JAKARTA
  const mapProvinceStats = useMemo(() => {
    const stats: { [key: string]: Penempatan[] } = {};
    (penempatanData as Penempatan[]).forEach((item) => {
      let province = item.provinsi;
      // Merge K/L/P and PUSAT into DKI JAKARTA for map display
      if (province === "K/L/P" || province === "PUSAT") {
        province = "DKI JAKARTA";
      }
      if (!stats[province]) {
        stats[province] = [];
      }
      stats[province].push(item);
    });
    return stats;
  }, []);

  const sortedProvinces = useMemo(() => {
    return Object.keys(provinceStats)
      .sort((a, b) => provinceStats[b].length - provinceStats[a].length)
      .filter((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [provinceStats, searchTerm]);

  const totalLulusan = (penempatanData as Penempatan[]).length;
  const totalProvinsi = Object.keys(provinceStats).length;

  // Auto-scroll to province when hovered on map
  useEffect(() => {
    if (hoveredProvince && provinceRefs.current[hoveredProvince]) {
      provinceRefs.current[hoveredProvince]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [hoveredProvince]);

  const handleProvinceSelect = useCallback((province: string | null) => {
    setSelectedProvince(province);
    if (province) {
      setHoveredProvince(province);
    }
  }, []);

  const handleProvinceHover = useCallback((province: string | null) => {
    setHoveredProvince(province);
  }, []);

  const handleProvinceDoubleClick = useCallback(
    (province: string) => {
      setModalData({
        province,
        people: mapProvinceStats[province] || [],
      });
    },
    [mapProvinceStats]
  );

  const openModal = (province: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalData({
      province,
      people: provinceStats[province],
    });
  };

  const closeModal = () => {
    setModalData(null);
  };

  // Login Page
  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-background">
          <div className="login-pattern"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <img
                  src="/Lambang_Badan_Pusat_Statistik_(BPS)_Indonesia.svg.png"
                  alt="Logo BPS"
                />
              </div>
              <h1>Dashboard Penempatan</h1>
              <p>Polstat STIS D4 63 dan D3 64</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="password">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Kata Sandi
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {loginError && (
                <div className="login-error">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="login-spinner"></div>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>Akses terbatas untuk alumni STIS</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <img
                src="/Lambang_Badan_Pusat_Statistik_(BPS)_Indonesia.svg.png"
                alt="Logo BPS"
              />
            </div>
            <div className="title-section">
              <h1>Dashboard Penempatan Lulusan</h1>
              <p>Polstat STIS D4 63 dan D3 64</p>
            </div>
          </div>
          <div className="stats-header">
            <div className="stat-item">
              <span className="stat-value">{totalLulusan}</span>
              <span className="stat-label">Total Lulusan</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{totalProvinsi}</span>
              <span className="stat-label">Wilayah</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="search-box">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="province-list-container">
            {/* Sticky selected province */}
            {selectedProvince && sortedProvinces.includes(selectedProvince) && (
              <div className="sticky-province">
                <div
                  ref={(el) => {
                    provinceRefs.current[selectedProvince] = el;
                  }}
                  className="province-item active"
                  onClick={() => setSelectedProvince(null)}
                >
                  <div className="province-info">
                    <span className="province-name">{selectedProvince}</span>
                    <span className="province-count">
                      {provinceStats[selectedProvince].length}
                    </span>
                  </div>
                  <div className="province-details">
                    {provinceStats[selectedProvince]
                      .slice(0, 5)
                      .map((person, idx) => (
                        <div key={idx} className="person-item">
                          <span className="person-name">{person.nama}</span>
                          <span className="person-unit">
                            {person.unitKerja}
                          </span>
                        </div>
                      ))}
                    <button
                      className="view-all-btn"
                      onClick={(e) => openModal(selectedProvince, e)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                      Lihat Selengkapnya (
                      {provinceStats[selectedProvince].length} orang)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable province list */}
            <div className="province-list">
              {sortedProvinces
                .filter((province) => province !== selectedProvince)
                .map((province) => (
                  <div
                    key={province}
                    ref={(el) => {
                      provinceRefs.current[province] = el;
                    }}
                    className={`province-item ${
                      hoveredProvince === province ? "hovered" : ""
                    }`}
                    onClick={() => setSelectedProvince(province)}
                  >
                    <div className="province-info">
                      <span className="province-name">{province}</span>
                      <span className="province-count">
                        {provinceStats[province].length}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* Map */}
        <div className="map-container">
          <MapComponent
            provinceStats={mapProvinceStats}
            selectedProvince={selectedProvince}
            onProvinceSelect={handleProvinceSelect}
            onProvinceHover={handleProvinceHover}
            onProvinceDoubleClick={handleProvinceDoubleClick}
          />

          {/* Legend */}
          <div className="legend">
            <h4>Jumlah Penempatan</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: "#dbeafe" }}
                ></div>
                <span>1 - 5</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: "#93c5fd" }}
                ></div>
                <span>6 - 10</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: "#60a5fa" }}
                ></div>
                <span>11 - 15</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: "#3b82f6" }}
                ></div>
                <span>16 - 20</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: "#1e40af" }}
                ></div>
                <span>&gt; 20</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Dashboard Penempatan STIS </p>
      </footer>

      {/* Modal */}
      {modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalData.province}</h2>
              <span className="modal-count">
                {modalData.people.length} orang
              </span>
              <button className="modal-close" onClick={closeModal}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-table-header">
                <span className="col-no">No</span>
                <span className="col-name">Nama</span>
                <span className="col-jabatan">Jabatan</span>
                <span className="col-unit">Unit Kerja</span>
              </div>
              <div className="modal-table-body">
                {modalData.people.map((person, idx) => (
                  <div key={idx} className="modal-table-row">
                    <span className="col-no">{idx + 1}</span>
                    <span className="col-name">{person.nama}</span>
                    <span className="col-jabatan">{person.jabatan}</span>
                    <span className="col-unit">{person.unitKerja}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
