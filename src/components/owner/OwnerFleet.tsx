import React, { useState, useEffect } from 'react';
import {
  Car,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  RefreshCw,
  X,
  Phone,
  Calendar,
  Sliders,
} from 'lucide-react';
import { VehicleRecord, ChauffeurRecord, VehicleCategoryType, VehicleOperationalStatus, ChauffeurOperationalStatus } from '../../types/owner';
import { ownerService } from '../../services/ownerService';
import { OwnerAddOns } from './OwnerAddOns';

export const OwnerFleet: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'vehicles' | 'chauffeurs' | 'availability' | 'amenities'>('vehicles');
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vehicle Modal
  const [vehModalOpen, setVehModalOpen] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Partial<VehicleRecord> | null>(null);

  // Chauffeur Modal
  const [chfModalOpen, setChfModalOpen] = useState(false);
  const [editingChf, setEditingChf] = useState<Partial<ChauffeurRecord> | null>(null);

  // Availability Checker form
  const [availDate, setAvailDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availCategory, setAvailCategory] = useState('all');
  const [availResult, setAvailResult] = useState<any | null>(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    const [vList, cList] = await Promise.all([
      ownerService.getVehicles(),
      ownerService.getChauffeurs(),
    ]);
    setVehicles(vList);
    setChauffeurs(cList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddVehicle = () => {
    setEditingVeh({
      id: '',
      registrationNumber: '',
      category: 'Sedan (4+1)',
      model: '',
      seatingCapacity: 4,
      status: 'AVAILABLE',
      insuranceExpiry: '2027-01-01',
      permitExpiry: '2028-01-01',
      fitnessExpiry: '2027-01-01',
      lastServiceDate: '2026-09-01',
      notes: '',
    });
    setVehModalOpen(true);
  };

  const handleOpenEditVehicle = (v: VehicleRecord) => {
    setEditingVeh({ ...v });
    setVehModalOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!editingVeh) return;
    const res = await ownerService.saveVehicle(editingVeh);
    if (res) {
      showNotification(`Vehicle ${res.registrationNumber} saved successfully`);
      setVehModalOpen(false);
      loadData();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Are you sure you want to remove this vehicle from fleet?')) {
      await ownerService.deleteVehicle(id);
      showNotification('Vehicle removed');
      loadData();
    }
  };

  const handleOpenAddChauffeur = () => {
    setEditingChf({
      id: '',
      name: '',
      mobileNumber: '',
      licenseNumber: '',
      licenseExpiry: '2030-01-01',
      status: 'AVAILABLE',
      dutyStatus: 'ON_DUTY',
      rating: 5.0,
      totalTripsCompleted: 0,
      emergencyContact: '',
      notes: '',
    });
    setChfModalOpen(true);
  };

  const handleOpenEditChauffeur = (c: ChauffeurRecord) => {
    setEditingChf({ ...c });
    setChfModalOpen(true);
  };

  const handleSaveChauffeur = async () => {
    if (!editingChf) return;
    const res = await ownerService.saveChauffeur(editingChf);
    if (res) {
      showNotification(`Chauffeur ${res.name} saved successfully`);
      setChfModalOpen(false);
      loadData();
    }
  };

  const handleCheckAvailability = async () => {
    setIsCheckingAvail(true);
    const res = await ownerService.checkAvailability(availDate, undefined, availCategory);
    setAvailResult(res);
    setIsCheckingAvail(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fleet & Chauffeur Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage certified vehicles, professional chauffeurs, compliance docs, and real-time availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubTab === 'vehicles' && (
            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          )}
          {activeSubTab === 'chauffeurs' && (
            <button
              type="button"
              onClick={handleOpenAddChauffeur}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chauffeur</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('vehicles')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'vehicles'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicles ({vehicles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('chauffeurs')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'chauffeurs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Chauffeurs ({chauffeurs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('availability')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'availability'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Availability Checker</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('amenities')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'amenities'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Add-ons & Amenities</span>
        </button>
      </div>

      {/* SUBTAB 1: VEHICLES */}
      {activeSubTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {v.category}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1">{v.model}</h3>
                    <p className="text-xs font-black text-slate-700 tracking-wide font-mono mt-0.5">
                      {v.registrationNumber}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      v.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : v.status === 'ASSIGNED' || v.status === 'ON TRIP'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : v.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold text-slate-800">{v.seatingCapacity} Passengers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assigned Chauffeur:</span>
                    <span className="font-bold text-slate-800">{v.assignedChauffeurName || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Insurance Expiry:</span>
                    <span className="font-semibold text-slate-600">{v.insuranceExpiry}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Fitness Expiry:</span>
                    <span className="font-semibold text-slate-600">{v.fitnessExpiry}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditVehicle(v)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: CHAUFFEURS */}
      {activeSubTab === 'chauffeurs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chauffeurs.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{c.mobileNumber}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.dutyStatus === 'ON_DUTY'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {c.dutyStatus}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>License No:</span>
                    <span className="font-mono text-slate-800 font-bold">{c.licenseNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance Rating:</span>
                    <span className="font-bold text-amber-600">★ {c.rating} ({c.totalTripsCompleted} trips)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assigned Vehicle:</span>
                    <span className="font-bold text-slate-800">{c.assignedVehiclePlate || 'Floating'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Emergency Contact:</span>
                    <span className="text-slate-600">{c.emergencyContact || 'Available on file'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditChauffeur(c)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: AVAILABILITY CHECKER */}
      {activeSubTab === 'availability' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">Real-Time Fleet Availability Checker</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify real-time vehicle and chauffeur availability for conflicting schedules and maintenance holds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trip Date</label>
              <input
                type="date"
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Vehicle Category</label>
              <select
                value={availCategory}
                onChange={(e) => setAvailCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="all">All Vehicle Types</option>
                <option value="sedan">Sedan (Dzire 4+1)</option>
                <option value="suv">SUV (Ertiga 6+1)</option>
                <option value="innova">Innova</option>
                <option value="crysta">Innova Crysta</option>
                <option value="tempo">Tempo Traveller (12+1)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckAvailability}
            disabled={isCheckingAvail}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            {isCheckingAvail ? 'Checking Fleet Schedule...' : 'Run Conflict & Availability Check'}
          </button>

          {availResult && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Availability Result: {availResult.isAvailable ? 'FLEET READY' : 'NO VEHICLES READY'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="font-semibold block text-slate-500">Available Vehicles</span>
                  <span className="text-lg font-black text-emerald-700">
                    {availResult.availableVehicles?.length ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="font-semibold block text-slate-500">Chauffeurs on Duty</span>
                  <span className="text-lg font-black text-blue-700">
                    {availResult.availableChauffeurs?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: AMENITIES & ADD-ONS */}
      {activeSubTab === 'amenities' && <OwnerAddOns />}

      {/* VEHICLE MODAL */}
      {vehModalOpen && editingVeh && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingVeh.id ? 'Edit Vehicle Details' : 'Add New Vehicle to Fleet'}
              </h3>
              <button
                type="button"
                onClick={() => setVehModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-09-EA-4401"
                    value={editingVeh.registrationNumber || ''}
                    onChange={(e) => setEditingVeh({ ...editingVeh, registrationNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingVeh.category}
                    onChange={(e) => setEditingVeh({ ...editingVeh, category: e.target.value as VehicleCategoryType })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  >
                    <option value="Sedan (4+1)">Sedan (4+1)</option>
                    <option value="SUV (6+1)">SUV (6+1)</option>
                    <option value="Innova">Innova</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo Traveller (12+1)">Tempo Traveller (12+1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Suzuki Dzire White"
                  value={editingVeh.model || ''}
                  onChange={(e) => setEditingVeh({ ...editingVeh, model: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={editingVeh.seatingCapacity || 4}
                    onChange={(e) => setEditingVeh({ ...editingVeh, seatingCapacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingVeh.status}
                    onChange={(e) => setEditingVeh({ ...editingVeh, status: e.target.value as VehicleOperationalStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="ON TRIP">ON TRIP</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={editingVeh.insuranceExpiry || ''}
                    onChange={(e) => setEditingVeh({ ...editingVeh, insuranceExpiry: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Permit Expiry</label>
                  <input
                    type="date"
                    value={editingVeh.permitExpiry || ''}
                    onChange={(e) => setEditingVeh({ ...editingVeh, permitExpiry: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fitness Expiry</label>
                  <input
                    type="date"
                    value={editingVeh.fitnessExpiry || ''}
                    onChange={(e) => setEditingVeh({ ...editingVeh, fitnessExpiry: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVehModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVehicle}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAUFFEUR MODAL */}
      {chfModalOpen && editingChf && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingChf.id ? 'Edit Chauffeur Record' : 'Enroll New Chauffeur'}
              </h3>
              <button
                type="button"
                onClick={() => setChfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Gowda"
                    value={editingChf.name || ''}
                    onChange={(e) => setEditingChf({ ...editingChf, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98451 22340"
                    value={editingChf.mobileNumber || ''}
                    onChange={(e) => setEditingChf({ ...editingChf, mobileNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driving License Number</label>
                  <input
                    type="text"
                    placeholder="KA09 20120004581"
                    value={editingChf.licenseNumber || ''}
                    onChange={(e) => setEditingChf({ ...editingChf, licenseNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Expiry</label>
                  <input
                    type="date"
                    value={editingChf.licenseExpiry || ''}
                    onChange={(e) => setEditingChf({ ...editingChf, licenseExpiry: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duty Status</label>
                  <select
                    value={editingChf.dutyStatus}
                    onChange={(e) => setEditingChf({ ...editingChf, dutyStatus: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="ON_DUTY">ON DUTY</option>
                    <option value="OFF_DUTY">OFF DUTY</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operational Status</label>
                  <select
                    value={editingChf.status}
                    onChange={(e) => setEditingChf({ ...editingChf, status: e.target.value as ChauffeurOperationalStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="ON TRIP">ON TRIP</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChfModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChauffeur}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                Save Chauffeur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
