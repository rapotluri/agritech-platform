import { Farmer } from "./FarmerTable"

// Plot interface based on the schema
export interface Plot {
  id: string
  farmerId: string
  province: string
  district: string
  commune: string
  village: string
  locationLat?: number
  locationLong?: number
  crop: string
  areaHa: number
  createdAt: Date
  updatedAt: Date
}

// Mock data for testing the UI
export const mockFarmers: Farmer[] = [
  {
    id: "f001",
    englishName: "Sok Dara",
    sex: "male",
    phone: "012345678",
    nationalId: "123456789",
    dob: new Date("1985-03-15"),
    enrolmentDate: new Date("2024-01-15"),
    province: "PhnomPenh",
    district: "ChamkarMon",
    commune: "BoengKengKang",
    village: "Village 1",
    kycStatus: "verified",
    bankAccountUsd: "USD123456",
    bankAccountKhr: "KHR789012",
    plotsCount: 3,
    assignedProduct: "Rice Insurance Premium"
  },
  {
    id: "f002",
    englishName: "Srey Mom",
    sex: "female",
    phone: "023456789",
    nationalId: "234567890",
    dob: new Date("1990-07-22"),
    enrolmentDate: new Date("2024-02-20"),
    province: "Kandal",
    district: "AngkSnuol",
    commune: "BaekChan",
    village: "Village 2",
    kycStatus: "pending",
    bankAccountUsd: "USD234567",
    bankAccountKhr: "KHR890123",
    plotsCount: 2,
    assignedProduct: "Corn Insurance Premium"
  },
  {
    id: "f003",
    englishName: "Chan Vuthy",
    sex: "male",
    phone: "034567890",
    nationalId: "345678901",
    dob: new Date("1988-11-08"),
    enrolmentDate: new Date("2024-03-10"),
    province: "Siemreab",
    district: "SiemReap",
    commune: "SiemReab",
    village: "Village 3",
    kycStatus: "verified",
    bankAccountUsd: "USD345678",
    bankAccountKhr: "KHR901234",
    plotsCount: 4,
    assignedProduct: "Cassava Insurance Premium"
  },
  {
    id: "f004",
    englishName: "Keo Sopheak",
    sex: "female",
    phone: "045678901",
    nationalId: "456789012",
    dob: new Date("1992-05-14"),
    enrolmentDate: new Date("2024-01-28"),
    province: "Battambang",
    district: "Battambang",
    commune: "ChomkarSomraong",
    village: "Village 4",
    kycStatus: "rejected",
    bankAccountUsd: "USD456789",
    bankAccountKhr: "KHR012345",
    plotsCount: 1,
    assignedProduct: "Soybean Insurance Premium"
  },
  {
    id: "f005",
    englishName: "Heng Samnang",
    sex: "male",
    phone: "056789012",
    nationalId: "567890123",
    dob: new Date("1983-09-30"),
    enrolmentDate: new Date("2024-02-15"),
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5",
    kycStatus: "verified",
    bankAccountUsd: "USD567890",
    bankAccountKhr: "KHR123456",
    plotsCount: 5,
    assignedProduct: "Rice Insurance Premium"
  },
  {
    id: "f006",
    englishName: "Nou Sreypich",
    sex: "female",
    phone: "067890123",
    nationalId: "678901234",
    dob: new Date("1995-12-03"),
    enrolmentDate: new Date("2024-03-05"),
    province: "Kampot",
    district: "Kampot",
    commune: "KampongBay",
    village: "Village 6",
    kycStatus: "pending",
    bankAccountUsd: "USD678901",
    bankAccountKhr: "KHR234567",
    plotsCount: 2,
    assignedProduct: "Vegetable Insurance Premium"
  },
  {
    id: "f007",
    englishName: "Ly Vannak",
    sex: "male",
    phone: "078901234",
    nationalId: "789012345",
    dob: new Date("1987-04-18"),
    enrolmentDate: new Date("2024-01-10"),
    province: "PreyVeng",
    district: "PreyVeng",
    commune: "Baray",
    village: "Village 7",
    kycStatus: "verified",
    bankAccountUsd: "USD789012",
    bankAccountKhr: "KHR345678",
    plotsCount: 3,
    assignedProduct: "Peanut Insurance Premium"
  },
  {
    id: "f008",
    englishName: "Chhun Sreyneang",
    sex: "female",
    phone: "089012345",
    nationalId: "890123456",
    dob: new Date("1993-08-25"),
    enrolmentDate: new Date("2024-02-28"),
    province: "Takev",
    district: "AngkorBorei",
    commune: "AngkorBorei",
    village: "Village 8",
    kycStatus: "pending",
    bankAccountUsd: "USD890123",
    bankAccountKhr: "KHR456789",
    plotsCount: 1,
    assignedProduct: "Corn Insurance Premium"
  },
  {
    id: "f009",
    englishName: "Prak Sovann",
    sex: "male",
    phone: "090123456",
    nationalId: "901234567",
    dob: new Date("1986-01-12"),
    enrolmentDate: new Date("2024-03-15"),
    province: "SvayRieng",
    district: "SvayRieng",
    commune: "SvayRieng",
    village: "Village 9",
    kycStatus: "verified",
    bankAccountUsd: "USD901234",
    bankAccountKhr: "KHR567890",
    plotsCount: 4,
    assignedProduct: "Rice Insurance Premium"
  },
  {
    id: "f010",
    englishName: "Kong Sothea",
    sex: "female",
    phone: "012345679",
    nationalId: "012345678",
    dob: new Date("1991-06-20"),
    enrolmentDate: new Date("2024-01-05"),
    province: "KampongThom",
    district: "KampongThom",
    commune: "KampongThom",
    village: "Village 10",
    kycStatus: "rejected",
    bankAccountUsd: "USD012345",
    bankAccountKhr: "KHR678901",
    plotsCount: 2,
    assignedProduct: "Cassava Insurance Premium"
  },
  {
    id: "f011",
    englishName: "Mao Dara",
    sex: "male",
    phone: "023456780",
    nationalId: "123456780",
    dob: new Date("1984-10-07"),
    enrolmentDate: new Date("2024-02-10"),
    province: "Kratie",
    district: "Kratie",
    commune: "Kratie",
    village: "Village 11",
    kycStatus: "verified",
    bankAccountUsd: "USD123450",
    bankAccountKhr: "KHR789012",
    plotsCount: 3,
    assignedProduct: "Soybean Insurance Premium"
  },
  {
    id: "f012",
    englishName: "Seng Sopheak",
    sex: "female",
    phone: "034567801",
    nationalId: "234567801",
    dob: new Date("1989-02-28"),
    enrolmentDate: new Date("2024-03-20"),
    province: "MondolKiri",
    district: "SaenMonourom",
    commune: "SaenMonourom",
    village: "Village 12",
    kycStatus: "pending",
    bankAccountUsd: "USD234560",
    bankAccountKhr: "KHR890123",
    plotsCount: 1,
    assignedProduct: "Vegetable Insurance Premium"
  },
  {
    id: "f013",
    englishName: "Yim Vuthy",
    sex: "male",
    phone: "045678012",
    nationalId: "345678012",
    dob: new Date("1982-12-15"),
    enrolmentDate: new Date("2024-01-25"),
    province: "Ratanakiri",
    district: "BanLung",
    commune: "BanLung",
    village: "Village 13",
    kycStatus: "verified",
    bankAccountUsd: "USD345670",
    bankAccountKhr: "KHR901234",
    plotsCount: 5,
    assignedProduct: "Rice Insurance Premium"
  },
  {
    id: "f014",
    englishName: "Kang Sreyroth",
    sex: "female",
    phone: "056789013",
    nationalId: "456789013",
    dob: new Date("1994-07-08"),
    enrolmentDate: new Date("2024-02-18"),
    province: "StungTreng",
    district: "StuengTraeng",
    commune: "StuengTraeng",
    village: "Village 14",
    kycStatus: "pending",
    bankAccountUsd: "USD456780",
    bankAccountKhr: "KHR012345",
    plotsCount: 2,
    assignedProduct: "Corn Insurance Premium"
  },
  {
    id: "f015",
    englishName: "Chea Vannak",
    sex: "male",
    phone: "067890124",
    nationalId: "567890124",
    dob: new Date("1988-05-22"),
    enrolmentDate: new Date("2024-03-08"),
    province: "KohKong",
    district: "KohKong",
    commune: "KohKong",
    village: "Village 15",
    kycStatus: "verified",
    bankAccountUsd: "USD567890",
    bankAccountKhr: "KHR123456",
    plotsCount: 3,
    assignedProduct: "Peanut Insurance Premium"
  }
]

// Mock plot data linked to farmers
export const mockPlots: Plot[] = [
  // Plots for Sok Dara (f001)
  {
    id: "p001",
    farmerId: "f001",
    province: "PhnomPenh",
    district: "ChamkarMon",
    commune: "BoengKengKang",
    village: "Village 1A",
    locationLat: 11.5564,
    locationLong: 104.9282,
    crop: "Rice",
    areaHa: 2.5,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: "p002",
    farmerId: "f001",
    province: "PhnomPenh",
    district: "ChamkarMon",
    commune: "BoengKengKang",
    village: "Village 1B",
    locationLat: 11.5574,
    locationLong: 104.9292,
    crop: "Vegetables",
    areaHa: 1.0,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20")
  },
  {
    id: "p003",
    farmerId: "f001",
    province: "PhnomPenh",
    district: "ChamkarMon",
    commune: "BoengKengKang",
    village: "Village 1C",
    crop: "Corn",
    areaHa: 1.8,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01")
  },
  
  // Plots for Srey Mom (f002)
  {
    id: "p004",
    farmerId: "f002",
    province: "Kandal",
    district: "AngkSnuol",
    commune: "BaekChan",
    village: "Village 2A",
    locationLat: 11.4678,
    locationLong: 104.8356,
    crop: "Corn",
    areaHa: 3.2,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20")
  },
  {
    id: "p005",
    farmerId: "f002",
    province: "Kandal",
    district: "AngkSnuol",
    commune: "BaekChan",
    village: "Village 2B",
    crop: "Rice",
    areaHa: 2.1,
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-02-25")
  },

  // Plots for Chan Vuthy (f003)
  {
    id: "p006",
    farmerId: "f003",
    province: "Siemreab",
    district: "SiemReap",
    commune: "SiemReab",
    village: "Village 3A",
    locationLat: 13.3671,
    locationLong: 103.8448,
    crop: "Cassava",
    areaHa: 4.5,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10")
  },
  {
    id: "p007",
    farmerId: "f003",
    province: "Siemreab",
    district: "SiemReap",
    commune: "SiemReab",
    village: "Village 3B",
    crop: "Rice",
    areaHa: 3.0,
    createdAt: new Date("2024-03-12"),
    updatedAt: new Date("2024-03-12")
  },
  {
    id: "p008",
    farmerId: "f003",
    province: "Siemreab",
    district: "SiemReap",
    commune: "SiemReab",
    village: "Village 3C",
    crop: "Vegetables",
    areaHa: 1.5,
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15")
  },
  {
    id: "p009",
    farmerId: "f003",
    province: "Siemreab",
    district: "SiemReap",
    commune: "SiemReab",
    village: "Village 3D",
    crop: "Cassava",
    areaHa: 2.8,
    createdAt: new Date("2024-03-18"),
    updatedAt: new Date("2024-03-18")
  },

  // Plot for Keo Sopheak (f004)
  {
    id: "p010",
    farmerId: "f004",
    province: "Battambang",
    district: "Battambang",
    commune: "ChomkarSomraong",
    village: "Village 4A",
    locationLat: 13.0957,
    locationLong: 103.2021,
    crop: "Soybean",
    areaHa: 2.0,
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28")
  },

  // Plots for Heng Samnang (f005)
  {
    id: "p011",
    farmerId: "f005",
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5A",
    crop: "Rice",
    areaHa: 5.0,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15")
  },
  {
    id: "p012",
    farmerId: "f005",
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5B",
    crop: "Rice",
    areaHa: 3.5,
    createdAt: new Date("2024-02-18"),
    updatedAt: new Date("2024-02-18")
  },
  {
    id: "p013",
    farmerId: "f005",
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5C",
    crop: "Vegetables",
    areaHa: 1.2,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20")
  },
  {
    id: "p014",
    farmerId: "f005",
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5D",
    crop: "Corn",
    areaHa: 2.3,
    createdAt: new Date("2024-02-22"),
    updatedAt: new Date("2024-02-22")
  },
  {
    id: "p015",
    farmerId: "f005",
    province: "KampongCham",
    district: "KampongCham",
    commune: "KampongCham",
    village: "Village 5E",
    crop: "Rice",
    areaHa: 4.0,
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-02-25")
  },

  // Plots for remaining farmers with fewer plots
  {
    id: "p016",
    farmerId: "f006",
    province: "Kampot",
    district: "Kampot",
    commune: "KampongBay",
    village: "Village 6A",
    crop: "Vegetables",
    areaHa: 1.8,
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05")
  },
  {
    id: "p017",
    farmerId: "f006",
    province: "Kampot",
    district: "Kampot",
    commune: "KampongBay",
    village: "Village 6B",
    crop: "Pepper",
    areaHa: 0.5,
    createdAt: new Date("2024-03-08"),
    updatedAt: new Date("2024-03-08")
  }
]

// Utility functions for filtering and sorting
export const filterFarmers = (
  farmers: Farmer[],
  searchQuery: string,
  province: string,
  district: string,
  commune: string,
  kycStatus: string,
  product: string,

): Farmer[] => {
  return farmers.filter(farmer => {
    // Search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        farmer.englishName.toLowerCase().includes(searchLower) ||
        farmer.nationalId.toLowerCase().includes(searchLower) ||
        farmer.phone.includes(searchQuery)
      if (!matchesSearch) return false
    }

    // Location filters
    if (province && farmer.province !== province) return false
    if (district && farmer.district !== district) return false
    if (commune && farmer.commune !== commune) return false

    // KYC status filter
    if (kycStatus && kycStatus !== "all" && farmer.kycStatus !== kycStatus) return false

    // Product filter
    if (product && product !== "all" && farmer.assignedProduct !== product) return false



    return true
  })
}

export const sortFarmers = (
  farmers: Farmer[],
  column: keyof Farmer,
  direction: "asc" | "desc"
): Farmer[] => {
  return [...farmers].sort((a, b) => {
    let aValue = a[column]
    let bValue = b[column]

    // Handle date comparisons
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime()
      bValue = bValue.getTime()
    }

    // Handle string comparisons
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    // Handle number comparisons
    if (typeof aValue === "number" && typeof bValue === "number") {
      if (direction === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    }

    // Handle string comparisons
    if (typeof aValue === "string" && typeof bValue === "string") {
      if (direction === "asc") {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    }

    return 0
  })
}
