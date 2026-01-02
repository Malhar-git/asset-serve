"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../lib/axios-interceptor";
import Header from "../UI-Components/header";
import { Plus, Star, Trash2, TrendingDown, TrendingUp, X, AlertCircle } from "lucide-react";

interface WatchListItem {
  id: number;
  symbolToken: string;
  symbolName: string;
  ltp: number;
  targetPrice: number;
  notes: string;
}

interface SearchResult {
  token: string;
  symbol: string;
  name: string;
}

interface AddStockModalData {
  symbolToken: string;
  symbolName: string;
  targetPrice: number;
  notes: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddStockModalData) => void;
}

export function AddStockModal({ isOpen, onClose, onAdd }: AddStockModalProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get(`/scriplist/search?q=${query}`);
      setSearchResults(response.data || []);
    } catch {
      setSearchError("Unable to search stocks. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = (stock: SearchResult) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!selectedStock) {
      setSearchError("Please select a stock from the search results.");
      return;
    }
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setSearchError("Please enter a valid target price.");
      return;
    }

    onAdd({
      symbolToken: selectedStock.token,
      symbolName: selectedStock.symbol,
      targetPrice: parseFloat(targetPrice),
      notes: notes
    });

    // Reset form
    setSearchQuery('');
    setSelectedStock(null);
    setTargetPrice('');
    setNotes('');
    setSearchResults([]);
    setSearchError(null);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add to Watchlist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="text-sm text-red-600">{searchError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Search Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Stock *
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name or symbol..."
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.token}
                      onClick={() => handleSelectStock(result)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{result.symbol}</div>
                      <div className="text-xs text-gray-500">{result.name}</div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {selectedStock && (
              <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-sm font-medium text-indigo-900">{selectedStock.symbol}</div>
                <div className="text-xs text-indigo-600">{selectedStock.name}</div>
              </div>
            )}
          </div>

          {/* Target Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Buy Price * (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 19000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the price you&apos;re looking to buy at
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add your notes here..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedStock || !targetPrice}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({ name: "", email: "" });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // Load user profile
    try {
      const raw = localStorage.getItem("userProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserDetails({
          name: typeof parsed?.name === "string" ? parsed.name : "",
          email: typeof parsed?.email === "string" ? parsed.email : "",
        });
      }
    } catch {
      // Profile loading is non-critical, continue without it
    }

    fetchWatchlist();

    // Refresh prices every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await api.get('/watchlist');
      setWatchlist(response.data || []);
      setError(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (data: AddStockModalData) => {
    try {
      setActionError(null);
      const response = await api.post('/watchlist', data);
      setWatchlist([...watchlist, response.data]);
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setActionError(errorMessage);
    }
  };

  const handleRemoveStock = async (symbolToken: string) => {
    if (!window.confirm('Are you sure you want to remove this stock from your watchlist?')) return;

    try {
      setActionError(null);
      await api.delete(`/watchlist/${symbolToken}`);
      setWatchlist(watchlist.filter(item => item.symbolToken !== symbolToken));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setActionError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="watchlist__page h-screen grid grid-rows-[auto_1fr] bg-indigo-50">
        <div className="header">
          <Header
            userName={userDetails.name}
            userEmail={userDetails.email}
            showBackToDashboard
          />
        </div>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading watchlist...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist__page h-screen grid grid-rows-[auto_1fr] border-2 border-indigo-800">
      <div className="header border-2 border-indigo-100">
        <Header
          userName={userDetails.name}
          userEmail={userDetails.email}
          showBackToDashboard
        />
      </div>
      <div className="main__content flex-1 overflow-auto p-6">
        {/* Page Title */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={24} />
                  My Watchlist
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'} tracked
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                Add Stock
              </button>
            </div>
          </div>

          {/* Action Error Message */}
          {actionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span className="text-sm text-red-600">{actionError}</span>
              <button
                onClick={() => setActionError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <AlertCircle size={24} className="mx-auto text-red-600 mb-2" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchWatchlist}
                className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Watchlist Table */}
          {watchlist.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Star className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in watchlist</h3>
              <p className="text-gray-500 mb-4">Start tracking stocks you&apos;re interested in buying</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                Add Your First Stock
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Price (LTP)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {watchlist.map((item) => {
                      const difference = (item.ltp ?? 0) - (item.targetPrice ?? 0);
                      const isAboveTarget = difference > 0;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.symbolName}</div>
                              <div className="text-xs text-gray-500">{item.symbolToken}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-gray-900">₹{item.ltp.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-indigo-600 font-medium">₹{item.targetPrice.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isAboveTarget ? (
                                <TrendingUp size={14} className="text-red-600" />
                              ) : (
                                <TrendingDown size={14} className="text-green-600" />
                              )}
                              <span className={`text-sm font-medium ${isAboveTarget ? 'text-red-600' : 'text-green-600'}`}>
                                {isAboveTarget ? '+' : ''}₹{Math.abs(difference).toFixed(2)}
                              </span>
                            </div>
                            {isAboveTarget ? (
                              <span className="text-xs text-red-500">Above target</span>
                            ) : (
                              <span className="text-xs text-green-500">Below target</span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <span className="text-sm text-gray-600 line-clamp-2">{item.notes || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleRemoveStock(item.symbolToken)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove from watchlist"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Stock Modal */}
          <AddStockModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddStock}
          />
        </div>
      </div>
    </div>
  );
}