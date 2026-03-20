import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { formatPrice, getHeroImage } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const hero = getHeroImage(property.images);

  return (
    <Link href={`/properties/${property.id}`} className="card group block hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-32 bg-slate-200 overflow-hidden">
        <Image
          src={hero}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Listing type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={property.listing_type === "buy" ? "info" : "success"}>
            {property.listing_type === "buy" ? "For Sale" : "For Rent"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <p className="text-lg font-bold text-slate-900">
          {formatPrice(property.price, property.currency)}
          {property.listing_type === "rent" && (
            <span className="text-sm font-normal text-slate-500">/mo</span>
          )}
        </p>

        {/* Title */}
        <p className="font-medium text-slate-800 mt-1 line-clamp-1">{property.title}</p>

        {/* Location */}
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.neighbourhood ? `${property.neighbourhood}, ${property.city}` : property.city}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.bedrooms} bd
            </span>
          )}
          {property.bathrooms > 0 && (
            <span>{property.bathrooms} ba</span>
          )}
          {property.area_sqm && (
            <span>{property.area_sqm} m²</span>
          )}
          <span className="capitalize">{property.property_type}</span>
        </div>
      </div>
    </Link>
  );
}
