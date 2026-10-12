package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List; // ✍️ تم تغيير import لـ List
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // ✅ START: تم تعديل نوع الإرجاع ليكون أكثر أمانًا
    /**
     * Finds documents by request ID where the file path ends with the given file name.
     * Returns a List to safely handle cases where the pattern might match multiple files.
     * @param requestId The ID of the service request.
     * @param fileName The name of the file to find (e.g., "report.pdf").
     * @return A List containing any found Documents.
     */
    @Query("SELECT d FROM Document d WHERE d.request.id = :requestId AND d.filePath LIKE %:fileName")
    List<Document> findByRequestIdAndFilePathEndingWith(@Param("requestId") Long requestId, @Param("fileName") String fileName);
    // ✅ END: نهاية التعديل
}