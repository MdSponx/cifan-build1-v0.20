import { Partner, PartnerFormData } from '../types/partner.types';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

class PartnerService {
  private collectionName = 'partners';

  async getAllPartners(): Promise<Partner[]> {
    try {
      // Try composite index query first
      try {
        const q = query(
          collection(db, this.collectionName),
          orderBy('level', 'asc'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Partner[];
      } catch (indexError: any) {
        // If composite index doesn't exist, fall back to simple query
        if (indexError?.code === 'failed-precondition' || indexError?.message?.includes('index')) {
          console.warn('Composite index not available, using fallback query');
          const q = query(
            collection(db, this.collectionName),
            orderBy('level', 'asc')
          );
          const snapshot = await getDocs(q);
          const partners = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          })) as Partner[];
          
          // Sort by createdAt in memory
          return partners.sort((a, b) => {
            if (a.level !== b.level) {
              return a.level - b.level;
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      return [];
    }
  }

  async getActivePartners(): Promise<Partner[]> {
    try {
      // Try simple query with status filter only
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Partner[];
      
      // Filter out any partners that might not have proper status and sort
      const activePartners = partners.filter(partner => 
        partner.status === 'active' && 
        partner.level && 
        typeof partner.order === 'number'
      );
      
      // Sort by level first, then by order, then by createdAt
      return activePartners.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        // Sort by order within same level
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        // Finally sort by creation date
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error fetching active partners:', error);
      return [];
    }
  }

  async getPartnerById(id: string): Promise<Partner | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as Partner;
      }
      return null;
    } catch (error) {
      console.error('Error fetching partner:', error);
      return null;
    }
  }

  async uploadLogo(file: File, partnerId: string): Promise<string> {
    try {
      console.log('Starting upload process for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Validate file before upload
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file format. Only JPG, PNG, SVG are supported.');
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit.');
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `${partnerId}_${timestamp}_${randomString}.${fileExtension}`;
      
      console.log('Generated filename:', fileName);
      console.log('Storage path: partners/' + fileName);
      
      const storageRef = ref(storage, `partners/${fileName}`);
      
      // Upload with progress tracking and error handling
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${Math.round(progress)}%`);
          },
          (error) => {
            console.error('Upload error details:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            switch (error.code) {
              case 'storage/unauthorized':
                reject(new Error('No permission to upload files. Contact system administrator.'));
                break;
              case 'storage/canceled':
                reject(new Error('Upload was canceled.'));
                break;
              case 'storage/quota-exceeded':
                reject(new Error('Storage quota exceeded. Contact system administrator.'));
                break;
              default:
                reject(new Error(`Upload failed: ${error.message}`));
            }
          },
          async () => {
            try {
              console.log('Upload completed, getting download URL...');
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Download URL obtained:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(new Error('Failed to get download URL.'));
            }
          }
        );
      });

      return uploadResult;
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error instanceof Error ? error : new Error('File upload failed.');
    }
  }

  async createPartner(data: PartnerFormData, createdBy: string, logoFile?: File): Promise<Partner> {
    try {
      const partnerId = Date.now().toString();
      let logoValue = data.logoValue;

      // Upload logo file if provided
      if (logoFile && data.logoType === 'upload') {
        logoValue = await this.uploadLogo(logoFile, partnerId);
      }

      const partnerData = {
        name: {
          th: data.nameTh,
          en: data.nameEn
        },
        logo: {
          type: data.logoType,
          value: logoValue
        },
        level: data.level,
        order: data.order,
        note: data.note,
        status: data.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy
      };

      const docRef = await addDoc(collection(db, this.collectionName), partnerData);
      return { 
        id: docRef.id, 
        ...partnerData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Partner;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  async updatePartner(id: string, data: PartnerFormData, logoFile?: File): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      let logoValue = data.logoValue;

      // Upload new logo file if provided
      if (logoFile && data.logoType === 'upload') {
        logoValue = await this.uploadLogo(logoFile, id);
      }

      const updateData = {
        name: {
          th: data.nameTh,
          en: data.nameEn
        },
        logo: {
          type: data.logoType,
          value: logoValue
        },
        level: data.level,
        order: data.order,
        note: data.note,
        status: data.status,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }
}

export const partnerService = new PartnerService();
