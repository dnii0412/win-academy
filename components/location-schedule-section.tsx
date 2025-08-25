import { MapPin, Clock, Calendar, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function LocationScheduleSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Танхимын сургалтын байршил / Campus Location</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Улаанбаатар хотын төвд байрлах манай сургалтын төвд ирж, бодит орчинд суралцаарай
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Map Placeholder */}
          <Card className="overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-600">Interactive Map</p>
              </div>
            </div>
          </Card>

          {/* Location Details */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-[#E10600] mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Хаяг / Address</h3>
                    <p className="text-gray-600">
                      Чингэлтэй дүүрэг, 3-р хороо
                      <br />
                      Pearl Tower 1101
                      <br />
                      Улаанбаатар, Монгол
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-[#E10600] mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Хичээлийн цаг / Class Hours</h3>
                    <p className="text-gray-600">
                      Даваа - Баасан: 18:30 - 21:00
                      <br />
                      Бямба: 10:00 - 17:00
                      <br />
                      Ням: Амралт
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-[#E10600] mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Дараагийн ангилал / Next Cohort</h3>
                    <p className="text-gray-600">
                      Эхлэх огноо: 2025 оны 2-р сарын 15
                      <br />
                      Бүртгэл хаагдах: 2025 оны 2-р сарын 10
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-[#E10600] mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Холбоо барих / Contact</h3>
                    <p className="text-gray-600">
                      Утас: 9016-6060
                      <br />
                      И-мэйл: info@winacademy.mn
                    </p>
                  </div>
                </div>

                <Button className="w-full bg-[#E10600] hover:bg-[#C70500] text-white">
                  Зам харуулах / Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
