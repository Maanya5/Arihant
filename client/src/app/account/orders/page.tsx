"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Package, Calendar, ChevronRight, ShoppingBag, Clock, CheckCircle2, Truck, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EmptyOrders } from "@/components/EmptyState";
import PageSpinner from "@/components/PageSpinner";

interface OrderItem {
  product: {
    name: string;
    image_url: string;
  };
  itemName: string;
  size: string;
  quantity: number;
  price_paisa: number;
}

interface Order {
  _id: string;
  orderStatus: 'pending' | 'processing' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setIsHydrated(true); }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/my-orders");
      setOrders(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError(err.response?.data?.message || "Something went wrong while fetching your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed': case 'packed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'processing': return <Package size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <CheckCircle2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  if (!isHydrated || (loading && orders.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)]/10">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="max-w-4xl w-full px-4 space-y-6">
            <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)]/10">
        <Navbar />
        <main className="flex-grow py-12 px-4 text-center">
          <div className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-sm border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-heading text-[var(--color-teal)] mb-4">Failed to Load Orders</h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <button 
              onClick={fetchOrders}
              className="px-8 py-3 bg-[var(--color-teal)] text-white rounded-xl font-bold hover:bg-[var(--color-teal)]/90 transition-all"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]/10">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-heading text-[var(--color-teal)]">My Orders</h1>
            <div className="px-4 py-1.5 bg-[var(--color-teal)]/10 text-[var(--color-teal)] rounded-full text-sm font-bold">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[40px] border border-[var(--color-teal)]/5 shadow-sm p-10">
              <EmptyOrders />
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Link 
                  key={order._id} 
                  href={`/account/orders/${order._id}`}
                  className="block bg-white rounded-[32px] border border-[var(--color-teal)]/5 shadow-sm hover:shadow-md hover:border-[var(--color-teal)]/20 transition-all group overflow-hidden"
                >
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Item Image Thumbnail */}
                    <div className="w-20 h-20 bg-[var(--color-bg)]/20 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                      {order.items[0]?.product?.image_url ? (
                        <Image 
                          src={order.items[0].product.image_url || '/fallback-product.jpg'} 
                          alt={order.items[0].itemName} 
                          fill sizes="80px"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="text-[var(--color-teal)]/30" />
                      )}
                    </div>

                    {/* Order Summary Info */}
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">#{order._id.slice(-8)}</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus}
                        </div>
                      </div>
                      <h3 className="text-xl font-heading text-[var(--color-teal)]">
                        {order.items[0]?.itemName} 
                        {order.items.length > 1 && <span className="text-gray-400 font-sans text-sm ml-2">+ {order.items.length - 1} more items</span>}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="font-bold text-[var(--color-teal)]">₹{(order.totalAmount / 100).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="self-end sm:self-center">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg)]/30 text-[var(--color-teal)] flex items-center justify-center group-hover:bg-[var(--color-teal)] group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
