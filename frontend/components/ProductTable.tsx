
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Button } from "@/components/ui/button"  
import { Trash } from "lucide-react"
  
  const products = [
    {
        productName: "Rice Insurance",
        cropType: "Rice",
        premium: "$100",
        coverageType: "Drought",
    },
    {
        productName: "Maize Insurance",
        cropType: "Maize",
        premium: "$150",
        coverageType: "Excess Rainfall",
    }
  ]
  
  export default function ProductTable() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Crop Type</TableHead>
            <TableHead>Premium (USD)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.productName}>
              <TableCell className="font-medium">{product.productName}</TableCell>
              <TableCell className="font-medium">{product.cropType}</TableCell>
              <TableCell>{product.premium}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                    <Button variant="agro">Edit</Button>
                    <Button variant="destructive" ><Trash className="w-4 h-4"/></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  