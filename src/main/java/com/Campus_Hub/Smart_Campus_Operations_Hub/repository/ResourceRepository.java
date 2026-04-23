package com.Campus_Hub.Smart_Campus_Operations_Hub.repository;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
}

