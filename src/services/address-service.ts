import { prisma } from '../lib/prisma.js';

export const addressService = {
  /**
   * Get all addresses for a user
   */
  getUserAddresses: async (userId: string) => {
    return prisma.address.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        zip: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Create a new address for a user
   */
  createAddress: async (
    userId: string,
    addressData: {
      name: string;
      street: string;
      city: string;
      zip: string;
      phone?: string;
    }
  ) => {
    return prisma.address.create({
      data: {
        ...addressData,
        userId,
      },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        zip: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Delete an address by id (only if it belongs to the user)
   */
  deleteAddress: async (addressId: string, userId: string) => {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error('Address not found or unauthorized');
    }

    return prisma.address.delete({
      where: { id: addressId },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        zip: true,
        phone: true,
      },
    });
  },

  /**
   * Get a specific address by id (only if it belongs to the user)
   */
  getAddressById: async (addressId: string, userId: string) => {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        zip: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
