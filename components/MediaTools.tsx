
import React, { useState, useRef, useEffect } from 'react';
import { batchAnalyzeTruckImages, validateVINCheckDigit } from '../services/geminiService';
import { createJobInCloud, addVehicleToJobInCloud, subscribeToJobs, subscribeToJobVehicles, updateJobStatusInCloud, auth } from '../services/firebase';
import { trackEvent } from '../services/analytics';
import { Job, Vehicle } from '../types';

const MediaTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'generate' | 'audio'>('jobs');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobVehicles, setJobVehicles] = useState<Vehicle[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jobNameInput, setJobNameInput] = useState('');
  
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to all jobs
  useEffect(() => {
    if (!auth?.currentUser) return;
    const unsub = subscribeToJobs(auth.currentUser.uid, (jobs) => {
        setAllJobs(jobs);
    });
    return () => unsub();
  }, []);

  // Subscribe to current job's vehicles
  useEffect(() => {
    if (!currentJob) {
        setJobVehicles([]);
        return;
    }
    const unsub = subscribeToJobVehicles(currentJob.id, (vehicles) => {
        setJobVehicles(vehicles);
    });
    return () => unsub();
  }, [currentJob]);

  const startNewJob = async () => {
    if (!jobNameInput || !auth?.currentUser) return;
    setLoading(true);
    
    const newJob: Omit<Job, 'id'> = {
        userId: auth.currentUser.uid,
        jobName: jobNameInput,
        jobDate: Date.now(),
        location: { lat: 0, lng: 0, address: 'Capturing GPS...' },
        status: 'pending',
        vehicleCount: 0,
        createdAt: Date.now(),
        exportedAt: null,
        vehicles: []
    };
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            newJob.location.lat = pos.coords.latitude;
            newJob.location.lng = pos