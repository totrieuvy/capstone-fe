import { useEffect, useState } from "react";
import api from "../../../config/axios";
import { Table, Input } from "antd";
import type { TableColumnsType } from "antd";
import "./Species.scss";
import { toast } from "react-toastify";
import type { SpeciesType } from "../../../types/species";

const { Search } = Input;

interface DataType {
  id: number;
  speciesName: string;
}

function Species() {
  const [species, setSpecies] = useState<SpeciesType[]>([]);
  const [filteredSpecies, setFilteredSpecies] = useState<SpeciesType[]>([]);

  const fetchSpecies = async () => {
    try {
      const response = await api.get("/api/species");
      setSpecies(response.data.data);
      setFilteredSpecies(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách loài hamster thất bại" + error);
    }
  };

  const handleSearch = (value: string) => {
    const filtered = species.filter((item) => item.speciesName.toLowerCase().includes(value.toLowerCase()));
    setFilteredSpecies(filtered);
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
    },
    {
      title: "Tên loài hamster",
      dataIndex: "speciesName",
      key: "speciesName",
      sorter: (a, b) => a.speciesName.localeCompare(b.speciesName),
      width: 300,
    },
  ];

  useEffect(() => {
    document.title = "Quản lí loài hamster";
    fetchSpecies();
  }, []);

  return (
    <div className="Species">
      <h1>Quản lí loài hamster</h1>

      <div className="search-box">
        <Search
          placeholder="Tìm kiếm loài hamster..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table dataSource={filteredSpecies} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
    </div>
  );
}

export default Species;
